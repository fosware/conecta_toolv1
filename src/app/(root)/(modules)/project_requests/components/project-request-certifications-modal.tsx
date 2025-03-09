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
  projectRequestId: number;
  certificationId: number;
  certification: Certification;
  observation?: string;
  isActive: boolean;
}

interface ProjectRequest {
  id: number;
  title: string;
}

interface ProjectRequestCertificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectRequest: ProjectRequest | null;
  onSuccess: () => void;
}

export function ProjectRequestCertificationsModal({
  open,
  onOpenChange,
  projectRequest,
  onSuccess,
}: ProjectRequestCertificationsModalProps) {
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

  // Cargar las certificaciones requeridas para esta solicitud
  const loadRequirementCertifications = async (showLoading = true) => {
    if (!projectRequest) return;
    
    try {
      if (showLoading) setIsLoading(true);
      const response = await fetch(`/api/project_requests/${projectRequest.id}/certifications`, {
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
    if (open && projectRequest) {
      loadCertifications();
      loadRequirementCertifications();
    } else {
      // Limpiar el formulario cuando se cierra
      setSelectedCertificationId("");
      setObservation("");
    }
  }, [open, projectRequest]);

  // Agregar una nueva certificación requerida
  const handleAddCertification = async () => {
    if (!projectRequest || !selectedCertificationId) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/project_requests/${projectRequest.id}/certifications`, {
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
    if (!projectRequest || !certificationToDelete) return;

    try {
      const response = await fetch(`/api/project_requests/${projectRequest.id}/certifications/${certificationToDelete}`, {
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

  // Filtrar las certificaciones que aún no han sido agregadas
  const availableCertifications = certifications.filter(
    (cert) => !requirementCertifications.some((req) => req.certificationId === cert.id)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Certificaciones Requeridas
              <div className="text-base font-normal mt-1">{projectRequest?.title}</div>
            </DialogTitle>
          </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Formulario para agregar nueva certificación */}
            <div className="space-y-4 border p-4 rounded-md">
              <h3 className="text-lg font-medium">Agregar Certificación</h3>
              
              <div className="space-y-2">
                <Label htmlFor="certification">Certificación</Label>
                <Select
                  value={selectedCertificationId}
                  onValueChange={setSelectedCertificationId}
                >
                  <SelectTrigger id="certification">
                    <SelectValue placeholder="Selecciona una certificación" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCertifications.length === 0 ? (
                      <SelectItem value="no-options" disabled>
                        No hay certificaciones disponibles
                      </SelectItem>
                    ) : (
                      availableCertifications.map((cert) => (
                        <SelectItem key={cert.id} value={cert.id.toString()}>
                          {cert.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observation">Observaciones (opcional)</Label>
                <Textarea
                  id="observation"
                  placeholder="Ingresa observaciones adicionales sobre esta certificación"
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleAddCertification}
                disabled={!selectedCertificationId || isSubmitting}
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
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Certificaciones Requeridas</h3>
              
              {requirementCertifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No hay certificaciones requeridas para esta solicitud de proyecto.
                </p>
              ) : (
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-3">
                    {requirementCertifications.map((req) => (
                      <Card key={req.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{req.certification.name}</h4>
                              </div>
                              {req.observation && (
                                <p className="text-sm text-muted-foreground">
                                  {req.observation}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteClick(req.id)}
                              title="Eliminar certificación requerida"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        )}
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog 
        open={deleteDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
            setCertificationToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la certificación requerida y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCertification}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
