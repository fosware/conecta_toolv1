"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Select components removidos - no se usan en el diseño final
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Edit, Trash2, Save, X } from "lucide-react"; // Plus removido - no se usa
import { getToken } from "@/lib/auth";
import { toast } from "sonner";

interface ProjectStage {
  id: number;
  name: string;
  description: string;
  projectId: number;
  assignedCompanyId?: number;
  assignedCompanyName?: string;
  progress: number;
  status: "pending" | "in-progress" | "completed";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interfaz Company removida - no se usa en el diseño final

interface ProjectStagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  projectTitle: string;
  onSuccess?: () => void;
}

export function ProjectStagesModal({
  open,
  onOpenChange,
  projectId,
  projectTitle,
  onSuccess,
}: ProjectStagesModalProps) {
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingStage, setEditingStage] = useState<ProjectStage | null>(null);
  // companies y isCreating removidos - no se usan en el diseño final

  // Estado para el diálogo de eliminación
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    stage: ProjectStage | null;
  }>({
    isOpen: false,
    stage: null,
  });

  // Estados para el formulario
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    assignedCompanyId: "",
    progress: 0,
    status: "pending" as "pending" | "in-progress" | "completed",
  });

  // Cargar etapas del proyecto
  const loadStages = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        toast.error("No se encontró token de autenticación");
        return;
      }

      const response = await fetch(
        `/api/project_management/${projectId}/stages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', response.status, errorText);
        throw new Error(`Error al cargar etapas: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setStages(data.stages || []);
    } catch (error) {
      console.error("Error loading stages:", error);
      toast.error("Error al cargar las etapas");
    } finally {
      setLoading(false);
    }
  };

  // ✅ useEffect optimizado - solo cargar etapas cuando sea necesario
  useEffect(() => {
    if (open) {
      loadStages();
      // loadCompanies removido - no se usa en el diseño final
    }
  }, [open, projectId]); // Dependencias específicas

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      assignedCompanyId: "", // Mantenemos para compatibilidad
      progress: 0, // Mantenemos para compatibilidad
      status: "pending", // Mantenemos para compatibilidad
    });
    setEditingStage(null);
    // No cambiamos isCreating ya que el form siempre está visible
  };

  // Iniciar creación de nueva etapa - simplificado
  const startCreating = () => {
    resetForm();
    // setIsCreating removido - formulario siempre visible
  };

  // Iniciar edición de etapa
  const startEditing = (stage: ProjectStage) => {
    setFormData({
      name: stage.name,
      description: stage.description,
      assignedCompanyId: stage.assignedCompanyId?.toString() || "", // Mantenemos para compatibilidad
      progress: stage.progress, // Mantenemos para compatibilidad
      status: stage.status, // Mantenemos para compatibilidad
    });
    setEditingStage(stage);
    // No cambiamos isCreating ya que el form siempre está visible
  };

  // Guardar etapa (crear o actualizar)
  const saveStage = async () => {
    try {
      const token = getToken();
      if (!token) {
        toast.error("No se encontró token de autenticación");
        return;
      }

      const url = `/api/project_management/${projectId}/stages`;

      const method = editingStage ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          editingStage
            ? {
                // Al editar, enviar stageId, nombre y descripción
                stageId: editingStage.id,
                name: formData.name,
                description: formData.description,
              }
            : {
                // Al crear, solo enviar nombre y descripción
                name: formData.name,
                description: formData.description,
              }
        ),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error al guardar etapa:', response.status, errorText);
        throw new Error(`Error al guardar la etapa: ${response.status} - ${errorText}`);
      }

      toast.success(editingStage ? "Etapa actualizada" : "Etapa creada");
      resetForm();
      loadStages();
      onSuccess?.();
    } catch (error) {
      console.error("Error saving stage:", error);
      toast.error("Error al guardar la etapa");
    }
  };

  // Abrir diálogo de eliminación
  const openDeleteDialog = (stage: ProjectStage) => {
    setDeleteDialog({
      isOpen: true,
      stage: stage,
    });
  };

  // Eliminar etapa (confirmado)
  const handleDeleteStage = async () => {
    if (!deleteDialog.stage) return;

    try {
      const token = getToken();
      if (!token) {
        toast.error("No se encontró token de autenticación");
        return;
      }

      const response = await fetch(
        `/api/project_management/${projectId}/stages/${deleteDialog.stage.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar la etapa");
      }

      toast.success("Etapa eliminada");
      setDeleteDialog({ isOpen: false, stage: null });
      loadStages();
      onSuccess?.();
    } catch (error) {
      console.error("Error deleting stage:", error);
      toast.error("Error al eliminar la etapa");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[700px] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Definir Etapas del Proyecto - {projectTitle}
          </DialogTitle>
          <DialogDescription>
            Define las etapas principales del proyecto para las categorías de
            los asociados.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          {/* Formulario para crear/editar etapa - Siempre visible */}
          <div className="flex-shrink-0">
            <div className="border rounded-lg p-3 space-y-3">
              <h3 className="text-lg font-semibold">
                {editingStage ? "Editar Etapa" : "Nueva Etapa"}
              </h3>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Nombre de la Etapa</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ej: Inicio, Manufactura, Entrega"
                    maxLength={30}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Descripción de la etapa..."
                    maxLength={80}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      name: "",
                      description: "",
                      assignedCompanyId: "",
                      progress: 0,
                      status: "pending",
                    });
                    setEditingStage(null);
                  }}
                  disabled={
                    !formData.name && !formData.description && !editingStage
                  }
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={saveStage}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>
          </div>

          {/* Tabla de etapas */}
          <div className="flex-1 overflow-hidden">
            <div className="border rounded-lg h-full flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Etapa</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8">
                          Cargando etapas...
                        </TableCell>
                      </TableRow>
                    ) : stages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8">
                          No hay etapas definidas
                        </TableCell>
                      </TableRow>
                    ) : (
                      stages.map((stage) => (
                        <TableRow key={stage.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{stage.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {stage.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditing(stage)}
                                title="Editar etapa"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(stage)}
                                title="Eliminar etapa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteDialog({
            isOpen,
            stage: isOpen ? deleteDialog.stage : null,
          })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la etapa "{deleteDialog.stage?.name}" y no
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStage}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
