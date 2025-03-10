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

interface ProjectRequirement {
  id?: number;
  requirementName: string;
  projectRequestId: number;
  isActive?: boolean;
  isDeleted?: boolean;
}

interface RequirementSpecialty {
  id: number;
  projectRequirementId: number;
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

interface RequirementSpecialtiesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement: ProjectRequirement | null;
  onSuccess?: () => void;
}

export function RequirementSpecialtiesModal({
  open,
  onOpenChange,
  requirement,
  onSuccess,
}: RequirementSpecialtiesModalProps) {
  // Estados para el formulario
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>("");
  const [selectedScopeId, setSelectedScopeId] = useState<string>("");
  const [selectedSubscopeId, setSelectedSubscopeId] = useState<string>("");
  const [observation, setObservation] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [specialtyToDelete, setSpecialtyToDelete] = useState<number | null>(
    null
  );

  // Estados para los datos
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [subscopes, setSubscopes] = useState<Subscope[]>([]);
  const [requirementSpecialties, setRequirementSpecialties] = useState<
    RequirementSpecialty[]
  >([]);
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

  // Cargar especialidades requeridas para el requerimiento
  const loadRequirementSpecialties = async (showLoading = true) => {
    if (!requirement || !requirement.id) return;

    try {
      if (showLoading) setIsLoading(true);
      const response = await fetch(
        `/api/project_requests/${requirement.projectRequestId}/requirements/${requirement.id}/specialties`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

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
    if (open && requirement) {
      loadSpecialties();
      loadScopes();
      loadSubscopes();
      loadRequirementSpecialties();
    }
  }, [open, requirement]);

  // Filtrar alcances cuando cambia la especialidad seleccionada
  useEffect(() => {
    if (selectedSpecialtyId) {
      const specialtyId = parseInt(selectedSpecialtyId);
      const filtered = scopes.filter(
        (scope) => scope.specialtyId === specialtyId
      );
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
      const filtered = subscopes.filter(
        (subscope) => subscope.scopeId === scopeId
      );
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

    if (!requirement || !requirement.id) return;
    if (!selectedSpecialtyId) {
      toast.error("Debes seleccionar una especialidad");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        specialtyId: parseInt(selectedSpecialtyId),
        scopeId: selectedScopeId ? parseInt(selectedScopeId) : undefined,
        subscopeId: selectedSubscopeId
          ? parseInt(selectedSubscopeId)
          : undefined,
        observation: observation || undefined,
      };

      const response = await fetch(
        `/api/project_requests/${requirement.projectRequestId}/requirements/${requirement.id}/specialties`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error al agregar la especialidad requerida"
        );
      }

      // Limpiar el formulario
      setSelectedSpecialtyId("");
      setSelectedScopeId("");
      setSelectedSubscopeId("");
      setObservation("");
      
      // Recargar las especialidades requeridas
      await loadRequirementSpecialties(false);
      
      toast.success("Especialidad requerida agregada correctamente");
    } catch (error) {
      console.error("Error adding requirement specialty:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al agregar la especialidad requerida"
      );
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
    if (!requirement || !requirement.id || !specialtyToDelete) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/project_requests/${requirement.projectRequestId}/requirements/${requirement.id}/specialties/${specialtyToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar la especialidad requerida");
      }

      // Cerrar el diálogo de confirmación
      setDeleteDialogOpen(false);
      setSpecialtyToDelete(null);
      
      // Actualizar la lista de especialidades requeridas sin recargar todas
      setRequirementSpecialties(
        requirementSpecialties.filter((spec) => spec.id !== specialtyToDelete)
      );
      
      toast.success("Especialidad requerida eliminada correctamente");
    } catch (error) {
      console.error("Error deleting requirement specialty:", error);
      toast.error("Error al eliminar la especialidad requerida");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cerrar el modal
  const handleClose = () => {
    // Limpiar el formulario
    setSelectedSpecialtyId("");
    setSelectedScopeId("");
    setSelectedSubscopeId("");
    setObservation("");
    
    // Cerrar el modal
    onOpenChange(false);
    
    // Llamar al callback de éxito si existe
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Especialidades del Requerimiento</DialogTitle>
            <DialogDescription>
              {requirement
                ? `Gestionar especialidades para el requerimiento: ${requirement.requirementName}`
                : "Seleccione un requerimiento para gestionar sus especialidades"}
            </DialogDescription>
          </DialogHeader>

          {requirement ? (
            <>
              <form onSubmit={handleAddSpecialty} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Especialidad</Label>
                    <Select
                      value={selectedSpecialtyId}
                      onValueChange={setSelectedSpecialtyId}
                    >
                      <SelectTrigger id="specialty">
                        <SelectValue placeholder="Seleccionar especialidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((specialty) => (
                          <SelectItem
                            key={specialty.id}
                            value={specialty.id.toString()}
                          >
                            {specialty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scope">Alcance</Label>
                    <Select
                      value={selectedScopeId}
                      onValueChange={setSelectedScopeId}
                      disabled={filteredScopes.length === 0}
                    >
                      <SelectTrigger id="scope">
                        <SelectValue placeholder="Seleccionar alcance" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredScopes.map((scope) => (
                          <SelectItem
                            key={scope.id}
                            value={scope.id.toString()}
                          >
                            {scope.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subscope">Subalcance</Label>
                    <Select
                      value={selectedSubscopeId}
                      onValueChange={setSelectedSubscopeId}
                      disabled={filteredSubscopes.length === 0}
                    >
                      <SelectTrigger id="subscope">
                        <SelectValue placeholder="Seleccionar subalcance" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSubscopes.map((subscope) => (
                          <SelectItem
                            key={subscope.id}
                            value={subscope.id.toString()}
                          >
                            {subscope.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observation">Observación</Label>
                    <Textarea
                      id="observation"
                      placeholder="Observaciones adicionales"
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !selectedSpecialtyId}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Especialidad
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">
                  Especialidades Requeridas
                </h3>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : requirementSpecialties.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No hay especialidades requeridas para este requerimiento.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {requirementSpecialties.map((reqSpecialty) => (
                      <div
                        key={reqSpecialty.id}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {reqSpecialty.specialty.name}
                            </Badge>
                            {reqSpecialty.scope && (
                              <Badge variant="secondary">
                                {reqSpecialty.scope.name}
                              </Badge>
                            )}
                            {reqSpecialty.subscope && (
                              <Badge variant="secondary">
                                {reqSpecialty.subscope.name}
                              </Badge>
                            )}
                          </div>
                          {reqSpecialty.observation && (
                            <p className="text-sm text-muted-foreground">
                              {reqSpecialty.observation}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(reqSpecialty.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Seleccione un requerimiento para gestionar sus especialidades.
            </p>
          )}

          <DialogFooter>
            <Button onClick={handleClose}>Cerrar</Button>
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
              Esta acción eliminará la especialidad requerida y no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSpecialty}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
