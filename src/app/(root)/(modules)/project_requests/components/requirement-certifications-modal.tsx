"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Certification {
  id: number;
  name: string;
  description?: string;
}

interface RequirementCertification {
  id: number;
  projectRequirementsId: number;
  certificationId: number;
  certification: Certification;
  observation?: string;
  isActive: boolean;
}

interface ProjectRequirement {
  id?: number;
  requirementName: string;
  projectRequestId: number;
  isActive?: boolean;
  isDeleted?: boolean;
}

interface RequirementCertificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement: ProjectRequirement | null;
  onSuccess: () => void;
}

export function RequirementCertificationsModal({
  open,
  onOpenChange,
  requirement,
  onSuccess,
}: RequirementCertificationsModalProps) {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [requirementCertifications, setRequirementCertifications] = useState<RequirementCertification[]>([]);
  const [selectedCertificationId, setSelectedCertificationId] = useState<string>("");
  const [observation, setObservation] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [certificationToDelete, setCertificationToDelete] = useState<number | null>(null);

  // Cargar las certificaciones disponibles
  const loadCertifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/certifications", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar las certificaciones");
      }

      const data = await response.json();
      setCertifications(data.items || []);
    } catch (error) {
      console.error("Error loading certifications:", error);
      toast.error("Error al cargar las certificaciones");
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar las certificaciones requeridas para este requerimiento
  const loadRequirementCertifications = async (showLoading = true) => {
    if (!requirement || !requirement.id) return;
    
    try {
      if (showLoading) setIsLoading(true);
      const response = await fetch(`/api/project_requests/${requirement.projectRequestId}/requirements/${requirement.id}/certifications`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar las certificaciones requeridas");
      }

      const data = await response.json();
      setRequirementCertifications(data.items || []);
    } catch (error) {
      console.error("Error loading requirement certifications:", error);
      toast.error("Error al cargar las certificaciones requeridas");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (open && requirement) {
      loadCertifications();
      loadRequirementCertifications();
    } else {
      // Limpiar el formulario cuando se cierra
      setSelectedCertificationId("");
      setObservation("");
    }
  }, [open, requirement]);

  // Agregar una nueva certificación requerida
  const handleAddCertification = async () => {
    if (!requirement || !requirement.id || !selectedCertificationId) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/project_requests/${requirement.projectRequestId}/requirements/${requirement.id}/certifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          certificationId: parseInt(selectedCertificationId),
          observation: observation.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al agregar la certificación requerida");
      }

      toast.success("Certificación requerida agregada exitosamente");
      
      // Limpiar el formulario
      setSelectedCertificationId("");
      setObservation("");
      
      // Recargar las certificaciones requeridas sin mostrar el indicador de carga
      await loadRequirementCertifications(false);
    } catch (error) {
      console.error("Error adding requirement certification:", error);
      toast.error(error instanceof Error ? error.message : "Error al agregar la certificación requerida");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir diálogo de confirmación para eliminar
  const handleDeleteClick = (id: number) => {
    setCertificationToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Eliminar una certificación requerida
  const handleDeleteCertification = async () => {
    if (!requirement || !requirement.id || !certificationToDelete) return;

    try {
      const response = await fetch(`/api/project_requests/${requirement.projectRequestId}/requirements/${requirement.id}/certifications/${certificationToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar la certificación requerida");
      }

      toast.success("Certificación requerida eliminada exitosamente");
      
      // Cerrar el diálogo de confirmación
      setDeleteDialogOpen(false);
      setCertificationToDelete(null);
      
      // Recargar las certificaciones requeridas sin mostrar el indicador de carga
      await loadRequirementCertifications(false);
    } catch (error) {
      console.error("Error deleting requirement certification:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar la certificación requerida");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Certificaciones Requeridas - {requirement?.requirementName}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Formulario para agregar certificación */}
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certification">Certificación</Label>
                  <Select
                    value={selectedCertificationId}
                    onValueChange={setSelectedCertificationId}
                    disabled={isLoading || isSubmitting}
                  >
                    <SelectTrigger id="certification">
                      <SelectValue placeholder="Selecciona una certificación" />
                    </SelectTrigger>
                    <SelectContent>
                      {certifications.map((cert) => (
                        <SelectItem key={cert.id} value={cert.id.toString()}>
                          {cert.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observation">Observación (opcional)</Label>
                  <Textarea
                    id="observation"
                    placeholder="Observación sobre la certificación requerida"
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    disabled={isLoading || isSubmitting}
                  />
                </div>
              </div>

              <Button
                onClick={handleAddCertification}
                disabled={!selectedCertificationId || isLoading || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Certificación
                  </>
                )}
              </Button>
            </div>

            {/* Lista de certificaciones requeridas */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : requirementCertifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay certificaciones requeridas
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requirementCertifications.map((req) => (
                      <Card key={req.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="font-medium">{req.certification.name}</div>
                              {req.observation && (
                                <div className="text-sm text-muted-foreground">
                                  {req.observation}
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => req.id && handleDeleteClick(req.id)}
                                className="text-red-500 hover:text-red-600"
                                title="Eliminar certificación"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la certificación requerida y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCertification}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
