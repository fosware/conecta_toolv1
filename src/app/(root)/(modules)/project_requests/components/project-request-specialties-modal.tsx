"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";

interface Specialty {
  id: number;
  name: string;
  description?: string;
}

interface Scope {
  id: number;
  name: string;
  description?: string;
  specialtyId: number;
}

interface Subscope {
  id: number;
  name: string;
  description?: string;
  scopeId: number;
}

interface RequirementSpecialty {
  id: number;
  projectRequestId: number;
  specialtyId: number;
  scopeId?: number;
  subscopeId?: number;
  observation?: string;
  isActive: boolean;
  specialty: Specialty;
  scope?: {
    id: number;
    name: string;
  };
  subscope?: {
    id: number;
    name: string;
  };
}

interface ProjectRequest {
  id: number;
  title: string;
}

interface ProjectRequestSpecialtiesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectRequest: ProjectRequest | null;
  onSuccess?: () => void;
}

export function ProjectRequestSpecialtiesModal({
  open,
  onOpenChange,
  projectRequest,
  onSuccess,
}: ProjectRequestSpecialtiesModalProps) {
  // Estados para el formulario
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>("");
  const [selectedScopeId, setSelectedScopeId] = useState<string>("");
  const [selectedSubscopeId, setSelectedSubscopeId] = useState<string>("");
  const [observation, setObservation] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [specialtyToDelete, setSpecialtyToDelete] = useState<number | null>(null);

  // Estados para los datos
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [subscopes, setSubscopes] = useState<Subscope[]>([]);
  const [requirementSpecialties, setRequirementSpecialties] = useState<RequirementSpecialty[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Estados para filtrar scopes y subscopes basados en selecciones
  const [filteredScopes, setFilteredScopes] = useState<Scope[]>([]);
  const [filteredSubscopes, setFilteredSubscopes] = useState<Subscope[]>([]);

  // Cargar especialidades
  const loadSpecialties = async () => {
    try {
      const response = await fetch("/api/specialties", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar las especialidades");
      }

      const data = await response.json();
      setSpecialties(data.items || []);
    } catch (error) {
      console.error("Error loading specialties:", error);
      toast.error("Error al cargar las especialidades");
    }
  };

  // Cargar alcances
  const loadScopes = async () => {
    try {
      const response = await fetch("/api/scopes", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los alcances");
      }

      const data = await response.json();
      setScopes(data.items || []);
    } catch (error) {
      console.error("Error loading scopes:", error);
      toast.error("Error al cargar los alcances");
    }
  };

  // Cargar subalcances
  const loadSubscopes = async () => {
    try {
      const response = await fetch("/api/subscopes", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los subalcances");
      }

      const data = await response.json();
      setSubscopes(data.items || []);
    } catch (error) {
      console.error("Error loading subscopes:", error);
      toast.error("Error al cargar los subalcances");
    }
  };

  // Cargar especialidades requeridas para el proyecto
  const loadRequirementSpecialties = async (showLoading = true) => {
    if (!projectRequest) return;
    
    try {
      if (showLoading) setIsLoading(true);
      const response = await fetch(`/api/project_requests/${projectRequest.id}/specialties`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar las especialidades requeridas");
      }

      const data = await response.json();
      setRequirementSpecialties(data.items || []);
    } catch (error) {
      console.error("Error loading requirement specialties:", error);
      toast.error("Error al cargar las especialidades requeridas");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (open && projectRequest) {
      loadSpecialties();
      loadScopes();
      loadSubscopes();
      loadRequirementSpecialties();
    }
  }, [open, projectRequest]);

  // Filtrar alcances cuando cambia la especialidad seleccionada
  useEffect(() => {
    if (selectedSpecialtyId) {
      const specialtyId = parseInt(selectedSpecialtyId);
      const filtered = scopes.filter(scope => scope.specialtyId === specialtyId);
      setFilteredScopes(filtered);
      
      // Resetear el alcance seleccionado si no hay alcances disponibles para esta especialidad
      if (filtered.length === 0) {
        setSelectedScopeId("");
        setSelectedSubscopeId("");
      }
    } else {
      setFilteredScopes([]);
      setSelectedScopeId("");
      setSelectedSubscopeId("");
    }
  }, [selectedSpecialtyId, scopes]);

  // Filtrar subalcances cuando cambia el alcance seleccionado
  useEffect(() => {
    if (selectedScopeId) {
      const scopeId = parseInt(selectedScopeId);
      const filtered = subscopes.filter(subscope => subscope.scopeId === scopeId);
      setFilteredSubscopes(filtered);
      
      // Resetear el subalcance seleccionado si no hay subalcances disponibles para este alcance
      if (filtered.length === 0) {
        setSelectedSubscopeId("");
      }
    } else {
      setFilteredSubscopes([]);
      setSelectedSubscopeId("");
    }
  }, [selectedScopeId, subscopes]);

  // Agregar una nueva especialidad requerida
  const handleAddSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectRequest) return;
    if (!selectedSpecialtyId) {
      toast.error("Debes seleccionar una especialidad");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        specialtyId: parseInt(selectedSpecialtyId),
        scopeId: selectedScopeId ? parseInt(selectedScopeId) : undefined,
        subscopeId: selectedSubscopeId ? parseInt(selectedSubscopeId) : undefined,
        observation: observation || undefined,
      };

      const response = await fetch(`/api/project_requests/${projectRequest.id}/specialties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al agregar la especialidad requerida");
      }

      toast.success("Especialidad requerida agregada exitosamente");
      
      // Limpiar el formulario
      setSelectedSpecialtyId("");
      setSelectedScopeId("");
      setSelectedSubscopeId("");
      setObservation("");
      
      // Recargar las especialidades requeridas sin mostrar el indicador de carga
      await loadRequirementSpecialties(false);
    } catch (error) {
      console.error("Error adding requirement specialty:", error);
      toast.error(error instanceof Error ? error.message : "Error al agregar la especialidad requerida");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir diálogo de confirmación para eliminar
  const handleDeleteClick = (id: number) => {
    setSpecialtyToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Eliminar una especialidad requerida
  const handleDeleteSpecialty = async () => {
    if (!projectRequest || !specialtyToDelete) return;
    
    try {
      const response = await fetch(`/api/project_requests/${projectRequest.id}/specialties/${specialtyToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar la especialidad requerida");
      }

      toast.success("Especialidad requerida eliminada exitosamente");
      
      // Recargar las especialidades requeridas sin mostrar el indicador de carga
      await loadRequirementSpecialties(false);
      
      // Notificar al componente padre si es necesario
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error deleting requirement specialty:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar la especialidad requerida");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              <div>Especialidades Requeridas</div>
              <div className="text-base font-normal text-muted-foreground mt-1">
                {projectRequest?.title}
              </div>
            </DialogTitle>
            <DialogDescription>
              Administra las especialidades requeridas para esta solicitud de proyecto
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Formulario para agregar nueva especialidad */}
              <div className="space-y-4 border p-4 rounded-md">
                <h3 className="text-lg font-medium">Agregar Especialidad</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidad *</Label>
                  <Select
                    value={selectedSpecialtyId}
                    onValueChange={setSelectedSpecialtyId}
                  >
                    <SelectTrigger id="specialty">
                      <SelectValue placeholder="Selecciona una especialidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty.id} value={specialty.id.toString()}>
                          {specialty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scope">Alcance (opcional)</Label>
                  <Select
                    value={selectedScopeId}
                    onValueChange={setSelectedScopeId}
                    disabled={!selectedSpecialtyId || filteredScopes.length === 0}
                  >
                    <SelectTrigger id="scope">
                      <SelectValue placeholder="Selecciona un alcance" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredScopes.map((scope) => (
                        <SelectItem key={scope.id} value={scope.id.toString()}>
                          {scope.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subscope">Subalcance (opcional)</Label>
                  <Select
                    value={selectedSubscopeId}
                    onValueChange={setSelectedSubscopeId}
                    disabled={!selectedScopeId || filteredSubscopes.length === 0}
                  >
                    <SelectTrigger id="subscope">
                      <SelectValue placeholder="Selecciona un subalcance" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubscopes.map((subscope) => (
                        <SelectItem key={subscope.id} value={subscope.id.toString()}>
                          {subscope.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observation">Observaciones (opcional)</Label>
                  <Textarea
                    id="observation"
                    placeholder="Agrega observaciones o requisitos específicos"
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleAddSpecialty}
                  disabled={isSubmitting || !selectedSpecialtyId}
                  className="w-full mt-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Agregar Especialidad
                </Button>
              </div>

              {/* Lista de especialidades requeridas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Especialidades Requeridas</h3>
                
                {requirementSpecialties.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No hay especialidades requeridas para esta solicitud de proyecto
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requirementSpecialties.map((req) => (
                      <div key={req.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{req.specialty.name}</h4>
                            </div>
                            {req.scope && (
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-muted-foreground">Alcance:</span>
                                <Badge variant="outline">{req.scope.name}</Badge>
                              </div>
                            )}
                            {req.subscope && (
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-muted-foreground">Subalcance:</span>
                                <Badge variant="outline">{req.subscope.name}</Badge>
                              </div>
                            )}
                            {req.observation && (
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Observaciones:</span> {req.observation}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteClick(req.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
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
            setSpecialtyToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la especialidad requerida y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSpecialty}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
