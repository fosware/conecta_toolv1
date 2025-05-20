"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Award, Loader2, Medal, Plus, Trash2, Building2 } from "lucide-react";
import { getToken } from "@/lib/auth";
import { ProjectRequestWithRelations } from "@/lib/schemas/project_request";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { RequirementCertificationsModal } from "./requirement-certifications-modal";
import { RequirementSpecialtiesModal } from "./requirement-specialties-modal";
import { RequirementParticipantsModal } from "./requirement-participants-modal";

// Esquema de validación para el formulario de requerimientos
const requirementFormSchema = z.object({
  requirementName: z
    .string()
    .min(1, "El nombre del requerimiento es obligatorio"),
  piecesNumber: z.coerce.number().optional().nullable(),
  observation: z.string().optional(),
  priority: z.coerce.number().min(1, "La prioridad debe ser al menos 1").default(1),
});

type RequirementFormValues = z.infer<typeof requirementFormSchema>;

// Tipo para los requerimientos
interface Requirement {
  id?: number;
  requirementName: string;
  projectRequestId: number;
  piecesNumber?: number | null;
  observation?: string;
  priority: number;
  isActive?: boolean;
  isDeleted?: boolean;
}

interface ProjectRequestRequirementsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectRequest: ProjectRequestWithRelations | null;
  onSuccess?: () => void;
}

export function ProjectRequestRequirementsModal({
  open,
  onOpenChange,
  projectRequest,
  onSuccess,
}: ProjectRequestRequirementsModalProps) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requirementToDelete, setRequirementToDelete] = useState<number | null>(
    null
  );
  const [editMode, setEditMode] = useState(false);
  const [requirementToEdit, setRequirementToEdit] =
    useState<Requirement | null>(null);
  const [certificationsModalOpen, setCertificationsModalOpen] = useState(false);
  const [specialtiesModalOpen, setSpecialtiesModalOpen] = useState(false);
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] =
    useState<Requirement | null>(null);

  // Inicializar el formulario
  const form = useForm<RequirementFormValues>({
    resolver: zodResolver(requirementFormSchema),
    defaultValues: {
      requirementName: "",
      piecesNumber: undefined,
      observation: "",
      priority: 1,
    },
  });

  // Resetear el formulario cuando cambia el modo de edición
  useEffect(() => {
    if (editMode && requirementToEdit) {
      form.reset({
        requirementName: requirementToEdit.requirementName,
        piecesNumber: requirementToEdit.piecesNumber,
        observation: requirementToEdit.observation || "",
        priority: requirementToEdit.priority || 1,
      });
    } else if (!editMode) {
      form.reset({
        requirementName: "",
        piecesNumber: undefined,
        observation: "",
        priority: 1,
      });
    }
  }, [editMode, requirementToEdit, form]);

  // Cargar los requerimientos existentes cuando se abre el modal
  useEffect(() => {
    if (open && projectRequest) {
      loadRequirements();
    } else {
      // Limpiar el estado cuando se cierra el modal
      setRequirements([]);
      form.reset();
    }
  }, [open, projectRequest]);

  // Función para cargar los requerimientos existentes
  const loadRequirements = async () => {
    if (!projectRequest) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/project_requests/${projectRequest.id}/requirements`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar los requerimientos");
      }

      const data = await response.json();
      setRequirements(data.items || []);
    } catch (error) {
      console.error("Error loading requirements:", error);
      toast.error("Error al cargar los requerimientos");
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el envío del formulario (agregar o actualizar)
  const handleFormSubmit = async (values: RequirementFormValues) => {
    if (!projectRequest) return;

    if (editMode && requirementToEdit) {
      await handleUpdateRequirement(values);
    } else {
      await handleAddRequirement(values);
    }
  };

  // Función para agregar un nuevo requerimiento
  const handleAddRequirement = async (values: RequirementFormValues) => {
    if (!projectRequest) return;

    try {
      setSubmitting(true);
      const response = await fetch(
        `/api/project_requests/${projectRequest.id}/requirements`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            requirementName: values.requirementName,
            piecesNumber: values.piecesNumber,
            observation: values.observation,
            priority: values.priority,
            projectRequestId: projectRequest.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al agregar el requerimiento");
      }

      toast.success("Requerimiento agregado correctamente");
      form.reset();
      await loadRequirements();

      // Llamar al callback de éxito para actualizar la vista principal sin necesidad de colapsar/expandir
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error adding requirement:", error);
      toast.error("Error al agregar el requerimiento");
    } finally {
      setSubmitting(false);
    }
  };

  // Función para actualizar un requerimiento
  const handleUpdateRequirement = async (values: RequirementFormValues) => {
    if (!projectRequest || !requirementToEdit || !requirementToEdit.id) return;

    try {
      setSubmitting(true);
      const response = await fetch(
        `/api/project_requests/${projectRequest.id}/requirements/${requirementToEdit.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            requirementName: values.requirementName,
            piecesNumber: values.piecesNumber,
            observation: values.observation,
            priority: values.priority,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al actualizar el requerimiento");
      }

      const data = await response.json();

      // Actualizar el requerimiento en el estado local
      setRequirements((prevRequirements) =>
        prevRequirements.map((req) =>
          req.id === requirementToEdit.id ? data.item : req
        )
      );

      toast.success("Requerimiento actualizado correctamente");
      setEditMode(false);
      setRequirementToEdit(null);
      form.reset({
        requirementName: "",
        piecesNumber: undefined,
        observation: "",
        priority: 1,
      });

      // Llamar al callback de éxito para actualizar la vista principal sin necesidad de colapsar/expandir
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating requirement:", error);
      toast.error("Error al actualizar el requerimiento");
    } finally {
      setSubmitting(false);
    }
  };

  // Función para iniciar la edición de un requerimiento
  const handleEditClick = (requirement: Requirement) => {
    setRequirementToEdit(requirement);
    setEditMode(true);
  };

  // Función para cancelar la edición
  const handleCancelEdit = () => {
    setEditMode(false);
    setRequirementToEdit(null);
    form.reset({
      requirementName: "",
      piecesNumber: undefined,
      observation: "",
    });
  };

  // Abrir diálogo de confirmación para eliminar
  const handleDeleteClick = (id: number) => {
    setRequirementToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Función para eliminar un requerimiento
  const handleDeleteRequirement = async () => {
    if (!projectRequest || !requirementToDelete) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/project_requests/${projectRequest.id}/requirements/${requirementToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el requerimiento");
      }

      // Cerrar el diálogo de confirmación
      setDeleteDialogOpen(false);
      setRequirementToDelete(null);

      // Actualizar la lista de requerimientos sin recargar todos
      setRequirements((prevRequirements) =>
        prevRequirements.filter((req) => req.id !== requirementToDelete)
      );

      toast.success("Requerimiento eliminado correctamente");

      // Llamar al callback de éxito para actualizar la vista principal sin necesidad de colapsar/expandir
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error deleting requirement:", error);
      toast.error("Error al eliminar el requerimiento");
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar el modal
  const handleClose = () => {
    form.reset();
    onOpenChange(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Requerimientos de la Solicitud</DialogTitle>
            <DialogDescription>
              {projectRequest
                ? `Gestionar requerimientos para la solicitud: ${projectRequest.title}`
                : "Seleccione una solicitud para gestionar sus requerimientos"}
            </DialogDescription>
          </DialogHeader>

          {projectRequest ? (
            <>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleFormSubmit)}
                  className="space-y-4"
                >
                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="requirementName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Requerimiento</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej: Diseño, Corte, Ensamble..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="piecesNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Piezas</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Ej: 10"
                                {...field}
                                value={
                                  field.value === null ||
                                  field.value === undefined
                                    ? ""
                                    : field.value
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prioridad</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="Ej: 1"
                                {...field}
                                value={field.value || 1}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="observation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observación</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Ej: Detalles adicionales sobre el requerimiento"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editMode ? "Actualizando..." : "Agregando..."}
                        </>
                      ) : (
                        <>
                          {!editMode && <Plus className="mr-2 h-4 w-4" />}
                          {editMode
                            ? "Actualizar Requerimiento"
                            : "Agregar Requerimiento"}
                        </>
                      )}
                    </Button>

                    {editMode && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={submitting}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </form>
              </Form>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">
                  Requerimientos Existentes
                </h3>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : requirements.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No hay requerimientos registrados para esta solicitud.
                  </p>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Prioridad</TableHead>
                          <TableHead>Requerimiento</TableHead>
                          <TableHead>Piezas</TableHead>
                          <TableHead>Observación</TableHead>
                          <TableHead className="w-[100px] text-right">
                            Acciones
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...requirements]
                          .sort((a, b) => (a.priority || 1) - (b.priority || 1))
                          .map((req) => (
                          <TableRow key={req.id}>
                            <TableCell className="font-medium">{req.priority || 1}</TableCell>
                            <TableCell>{req.requirementName}</TableCell>
                            <TableCell>{req.piecesNumber}</TableCell>
                            <TableCell>{req.observation}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {/* Se eliminaron los botones de Certificaciones, Especialidades y Asociados participantes
                                 ya que ahora están disponibles en el overview */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditClick(req)}
                                  title="Editar requerimiento"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="lucide lucide-pencil h-4 w-4"
                                  >
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                    <path d="m15 5 4 4" />
                                  </svg>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    req.id && handleDeleteClick(req.id)
                                  }
                                  className="text-red-500 hover:text-red-600"
                                  title="Eliminar requerimiento"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Seleccione una solicitud para gestionar sus requerimientos.
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
            setRequirementToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el requerimiento y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRequirement}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal para gestionar certificaciones del requerimiento */}
      <RequirementCertificationsModal
        open={certificationsModalOpen}
        onOpenChange={setCertificationsModalOpen}
        requirement={selectedRequirement}
        onSuccess={() => {
          // Opcional: recargar datos si es necesario
        }}
      />

      {/* Modal para gestionar especialidades del requerimiento */}
      <RequirementSpecialtiesModal
        open={specialtiesModalOpen}
        onOpenChange={setSpecialtiesModalOpen}
        requirement={selectedRequirement}
        onSuccess={() => {
          // Opcional: recargar datos si es necesario
        }}
      />

      {/* Modal para gestionar participantes del requerimiento */}
      <RequirementParticipantsModal
        open={participantsModalOpen}
        onOpenChange={setParticipantsModalOpen}
        requirement={selectedRequirement}
        onSuccess={() => {
          // Opcional: recargar datos si es necesario
        }}
      />
    </>
  );

  // Función para gestionar certificaciones de un requerimiento
  function handleManageCertifications(requirement: Requirement) {
    setSelectedRequirement(requirement);
    setCertificationsModalOpen(true);
  }

  // Función para gestionar especialidades de un requerimiento
  function handleManageSpecialties(requirement: Requirement) {
    setSelectedRequirement(requirement);
    setSpecialtiesModalOpen(true);
  }

  // Función para gestionar participantes de un requerimiento
  function handleManageParticipants(requirement: Requirement) {
    setSelectedRequirement(requirement);
    setParticipantsModalOpen(true);
  }
}
