"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { Loader2, Trash2, Pencil } from "lucide-react";
import {
  type CompanySpecialty,
  type Especialidad,
  type Alcance,
  type Subalcance,
} from "@/types";
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

interface SpecialtiesModalProps {
  open: boolean;
  onClose: () => void;
  companyId: number;
  companyName: string;
}

export function SpecialtiesModal({
  open,
  onClose,
  companyId,
  companyName,
}: SpecialtiesModalProps) {
  const [companySpecialties, setCompanySpecialties] = useState<
    CompanySpecialty[]
  >([]);
  const [specialties, setSpecialties] = useState<Especialidad[]>([]);
  const [scopes, setScopes] = useState<Alcance[]>([]);
  const [subscopes, setSubscopes] = useState<Subalcance[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState({
    id: null as number | null,
    specialtyId: "",
    scopeId: "",
    subscopeId: "",
    materials: "",
    machineCapacity: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [specialtyToDelete, setSpecialtyToDelete] = useState<number | null>(
    null
  );

  const resetForm = () => {
    setNewSpecialty({
      id: null,
      specialtyId: "",
      scopeId: "",
      subscopeId: "",
      materials: "",
      machineCapacity: "",
    });
    setIsEditing(false);
    setScopes([]);
    setSubscopes([]);
  };

  // Limpiar estado cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const loadCompanySpecialties = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/companies/${companyId}/specialties`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar las especialidades");
      }

      if (!data.success) {
        throw new Error(data.error || "Error al cargar las especialidades");
      }

      setCompanySpecialties(data.data);
    } catch (error) {
      console.error("Error al cargar las especialidades:", error);
      toast.error("Error al cargar las especialidades");
    } finally {
      setLoading(false);
    }
  };

  const loadSpecialties = async () => {
    try {
      const response = await fetch("/api/specialties", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Error al cargar el catálogo de especialidades"
        );
      }

      if (!data.success) {
        throw new Error(
          data.error || "Error al cargar el catálogo de especialidades"
        );
      }

      setSpecialties(data.data);
    } catch (error) {
      console.error("Error al cargar el catálogo de especialidades:", error);
      toast.error("Error al cargar el catálogo de especialidades");
    }
  };

  const loadScopes = async (specialtyId: string) => {
    try {
      const response = await fetch(`/api/specialties/${specialtyId}/scopes`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar los alcances");
      }

      if (!data.success) {
        throw new Error(data.error || "Error al cargar los alcances");
      }

      setScopes(data.data);
    } catch (error) {
      console.error("Error al cargar los alcances:", error);
      toast.error("Error al cargar los alcances");
    }
  };

  const loadSubscopes = async (scopeId: string) => {
    try {
      const response = await fetch(`/api/scopes/${scopeId}/subscopes`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar los subalcances");
      }

      if (!data.success) {
        throw new Error(data.error || "Error al cargar los subalcances");
      }

      setSubscopes(data.data);
    } catch (error) {
      console.error("Error al cargar los subalcances:", error);
      toast.error("Error al cargar los subalcances");
    }
  };

  const handleAddSpecialty = async () => {
    try {
      if (!newSpecialty.specialtyId) {
        toast.error("La especialidad es requerida");
        return;
      }

      setSubmitting(true);

      const response = await fetch(
        `/api/companies/${companyId}/specialties${newSpecialty.id ? `/${newSpecialty.id}` : ""}`,
        {
          method: newSpecialty.id ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            specialtyId: parseInt(newSpecialty.specialtyId),
            scopeId:
              newSpecialty.scopeId && newSpecialty.scopeId !== "none"
                ? parseInt(newSpecialty.scopeId)
                : null,
            subscopeId:
              newSpecialty.subscopeId && newSpecialty.subscopeId !== "none"
                ? parseInt(newSpecialty.subscopeId)
                : null,
            materials: newSpecialty.materials || "",
            machineCapacity: newSpecialty.machineCapacity || "",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Error al ${newSpecialty.id ? "actualizar" : "agregar"} la especialidad`
        );
      }

      if (!data.success) {
        throw new Error(
          data.error ||
            `Error al ${newSpecialty.id ? "actualizar" : "agregar"} la especialidad`
        );
      }

      toast.success(
        data.message ||
          `Especialidad ${newSpecialty.id ? "actualizada" : "agregada"} correctamente`
      );
      resetForm();
      loadCompanySpecialties();
    } catch (error) {
      console.error(
        `Error al ${newSpecialty.id ? "actualizar" : "agregar"} la especialidad:`,
        error
      );
      toast.error(
        error instanceof Error
          ? error.message
          : `Error al ${newSpecialty.id ? "actualizar" : "agregar"} la especialidad`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSpecialty = (spec: CompanySpecialty) => {
    setNewSpecialty({
      id: spec.id,
      specialtyId: spec.specialtyId.toString(),
      scopeId: spec.scopeId?.toString() || "none",
      subscopeId: spec.subscopeId?.toString() || "none",
      materials: spec.materials || "",
      machineCapacity: spec.machineCapacity || "",
    });
    setIsEditing(true);

    // Cargar los alcances para la especialidad seleccionada
    if (spec.specialtyId) {
      loadScopes(spec.specialtyId.toString());
    }
    // Cargar los subalcances si hay un alcance seleccionado
    if (spec.scopeId) {
      loadSubscopes(spec.scopeId.toString());
    }
  };

  const cancelEdit = () => {
    resetForm();
  };

  const handleDeleteSpecialty = async (specialtyId: number) => {
    try {
      // Actualizar el estado local inmediatamente
      setCompanySpecialties((prev) =>
        prev.filter((specialty) => specialty.id !== specialtyId)
      );

      const response = await fetch(
        `/api/companies/${companyId}/specialties/${specialtyId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        // Si hay error, revertir el cambio local
        loadCompanySpecialties();
        throw new Error("Error al eliminar la especialidad");
      }

      toast.success("Especialidad eliminada correctamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar la especialidad");
    } finally {
      setDeleteDialogOpen(false);
      setSpecialtyToDelete(null);
    }
  };

  const handleSpecialtyChange = (value: string) => {
    setNewSpecialty((prev) => ({
      ...prev,
      specialtyId: value,
      scopeId: "",
      subscopeId: "",
    }));

    // Limpiar los datos dependientes
    setScopes([]);
    setSubscopes([]);

    // Cargar los nuevos alcances
    if (value) {
      loadScopes(value);
    }
  };

  const handleScopeChange = (value: string) => {
    setNewSpecialty((prev) => ({
      ...prev,
      scopeId: value,
      subscopeId: "",
    }));

    // Limpiar los subalcances
    setSubscopes([]);

    // Cargar los nuevos subalcances
    if (value && value !== "none") {
      loadSubscopes(value);
    }
  };

  useEffect(() => {
    if (open) {
      loadCompanySpecialties();
      loadSpecialties();
      setNewSpecialty({
        id: null,
        specialtyId: "",
        scopeId: "",
        subscopeId: "",
        materials: "",
        machineCapacity: "",
      });
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] lg:max-w-[800px] h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>
              <span className="text-muted-foreground">Especialidades de </span>
              <span className="text-blue-500 dark:text-blue-400 font-bold">
                {companyName}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 pt-2">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Especialidad</Label>
                  <Select
                    value={newSpecialty.specialtyId}
                    onValueChange={handleSpecialtyChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una especialidad" />
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
                  <Label>Alcance</Label>
                  <Select
                    value={newSpecialty.scopeId}
                    onValueChange={handleScopeChange}
                    disabled={!newSpecialty.specialtyId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un alcance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {scopes.map((scope) => (
                        <SelectItem key={scope.id} value={scope.id.toString()}>
                          {scope.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subalcance</Label>
                  <Select
                    value={newSpecialty.subscopeId}
                    onValueChange={(value) =>
                      setNewSpecialty((prev) => ({
                        ...prev,
                        subscopeId: value,
                      }))
                    }
                    disabled={
                      !newSpecialty.scopeId || newSpecialty.scopeId === "none"
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un subalcance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {subscopes.map((subscope) => (
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
              </div>

              <div className="space-y-2">
                <Label>
                  Capacidades del proceso (tamaños, materiales, volúmenes, ...)
                </Label>
                <Textarea
                  value={newSpecialty.materials}
                  rows={6}
                  onChange={(e) =>
                    setNewSpecialty((prev) => ({
                      ...prev,
                      materials: e.target.value,
                    }))
                  }
                  placeholder="Ingresa las capacidades..."
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Capacidad instalada (listado de máquinas para realizar el
                  proceso)
                </Label>
                <Textarea
                  value={newSpecialty.machineCapacity}
                  rows={6}
                  onChange={(e) =>
                    setNewSpecialty((prev) => ({
                      ...prev,
                      machineCapacity: e.target.value,
                    }))
                  }
                  placeholder="Ingresa la capacidad instalada..."
                  className="w-full"
                />
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                  className="mr-2"
                  disabled={submitting}
                  style={{ display: isEditing ? "inline-flex" : "none" }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleAddSpecialty} disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing
                    ? "Actualizar Especialidad"
                    : "Agregar Especialidad"}
                </Button>
              </div>

              <div className="mt-4 border rounded-md">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">
                          Especialidad
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          Alcance
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          Subalcance
                        </TableHead>
                        <TableHead className="w-20 text-center whitespace-nowrap">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                          </TableCell>
                        </TableRow>
                      ) : companySpecialties.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            No hay especialidades registradas
                          </TableCell>
                        </TableRow>
                      ) : (
                        companySpecialties.map((spec) => (
                          <TableRow
                            key={spec.id}
                            className="hover:bg-muted/50"
                          >
                            <TableCell className="font-medium whitespace-nowrap">
                              {spec.specialty?.name}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {spec.scope?.name || "-"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {spec.subscope?.name || "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditSpecialty(spec)}
                                  className="mx-auto"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteSpecialty(spec.id)}
                                  className="mx-auto"
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
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la especialidad seleccionada y no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                specialtyToDelete && handleDeleteSpecialty(specialtyToDelete)
              }
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
