"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Loader2, Trash2 } from "lucide-react";

interface SpecialtiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  associateId: number;
}

type AssociateSpecialty = {
  id: number;
  specialtyId: number;
  scopeId: number;
  subscopeId: number;
  materials: string | null;
  specialty: {
    name: string;
  };
  scope: {
    name: string;
  };
  subscope: {
    name: string;
  };
};

type Specialty = {
  id: number;
  name: string;
};

type Scope = {
  id: number;
  name: string;
};

type Subscope = {
  id: number;
  name: string;
};

export function SpecialtiesModal({
  isOpen,
  onClose,
  associateId,
}: SpecialtiesModalProps) {
  const [associateSpecialties, setAssociateSpecialties] = useState<AssociateSpecialty[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [subscopes, setSubscopes] = useState<Subscope[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState({
    specialtyId: "",
    scopeId: "",
    subscopeId: "",
    materials: "",
  });

  const loadAssociateSpecialties = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/asociados/${associateId}/specialties`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar las especialidades");
      }

      const data = await response.json();
      setAssociateSpecialties(data.items || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar las especialidades");
    } finally {
      setLoading(false);
    }
  };

  const loadSpecialties = async () => {
    try {
      const response = await fetch('/api/especialidades/catalogo', {
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
      console.error("Error:", error);
      toast.error("Error al cargar las especialidades");
    }
  };

  const loadScopes = async (specialtyId: string) => {
    if (!specialtyId) {
      setScopes([]);
      return;
    }

    try {
      const response = await fetch(`/api/especialidades/${specialtyId}/alcances`, {
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
      console.error("Error:", error);
      toast.error("Error al cargar los alcances");
    }
  };

  const loadSubscopes = async (scopeId: string) => {
    if (!scopeId || scopeId === "none") {
      setSubscopes([]);
      return;
    }

    try {
      const response = await fetch(`/api/alcances/${scopeId}/subalcances`, {
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
      console.error("Error:", error);
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

      const response = await fetch(`/api/asociados/${associateId}/specialties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          specialtyId: parseInt(newSpecialty.specialtyId),
          scopeId: newSpecialty.scopeId && newSpecialty.scopeId !== "none" ? parseInt(newSpecialty.scopeId) : null,
          subscopeId: newSpecialty.subscopeId && newSpecialty.subscopeId !== "none" ? parseInt(newSpecialty.subscopeId) : null,
          materials: newSpecialty.materials || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Error al agregar la especialidad");
        return;
      }

      toast.success("Especialidad agregada correctamente");
      
      // Limpiar el formulario
      setNewSpecialty({
        specialtyId: "",
        scopeId: "",
        subscopeId: "",
        materials: "",
      });
      
      // Recargar la lista de especialidades
      await loadAssociateSpecialties();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al agregar la especialidad");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(
        `/api/asociados/${associateId}/specialties?specialtyId=${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar la especialidad");
      }

      toast.success("Especialidad eliminada correctamente");
      await loadAssociateSpecialties(); // Recargar inmediatamente después de eliminar
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar la especialidad");
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAssociateSpecialties();
      loadSpecialties();
      // Limpiar el formulario al abrir el modal
      setNewSpecialty({
        specialtyId: "",
        scopeId: "",
        subscopeId: "",
        materials: "",
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (newSpecialty.specialtyId) {
      loadScopes(newSpecialty.specialtyId);
      setNewSpecialty(prev => ({ ...prev, scopeId: "", subscopeId: "" }));
    }
  }, [newSpecialty.specialtyId]);

  useEffect(() => {
    if (newSpecialty.scopeId === "none") {
      setNewSpecialty(prev => ({ ...prev, subscopeId: "none" }));
      setSubscopes([]);
    } else if (newSpecialty.scopeId) {
      loadSubscopes(newSpecialty.scopeId);
      setNewSpecialty(prev => ({ ...prev, subscopeId: "" }));
    }
  }, [newSpecialty.scopeId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Especialidades</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulario para agregar especialidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="specialtyId">Especialidad</Label>
              <Select
                value={newSpecialty.specialtyId}
                onValueChange={(value) =>
                  setNewSpecialty({ ...newSpecialty, specialtyId: value })
                }
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar especialidad" />
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

            <div>
              <Label htmlFor="scopeId">Alcance</Label>
              <Select
                value={newSpecialty.scopeId}
                onValueChange={(value) =>
                  setNewSpecialty({ ...newSpecialty, scopeId: value })
                }
                disabled={submitting || !newSpecialty.specialtyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar alcance" />
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

            <div>
              <Label htmlFor="subscopeId">Subalcance</Label>
              <Select
                value={newSpecialty.subscopeId}
                onValueChange={(value) =>
                  setNewSpecialty({ ...newSpecialty, subscopeId: value })
                }
                disabled={submitting || !newSpecialty.scopeId || newSpecialty.scopeId === "none"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar subalcance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {subscopes.map((subscope) => (
                    <SelectItem key={subscope.id} value={subscope.id.toString()}>
                      {subscope.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="materials">Materiales</Label>
              <Textarea
                value={newSpecialty.materials}
                onChange={(e) =>
                  setNewSpecialty({ ...newSpecialty, materials: e.target.value })
                }
                disabled={submitting}
                placeholder="Especificar materiales..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleAddSpecialty}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agregar Especialidad
            </Button>
          </div>

          {/* Lista de especialidades */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Alcance</TableHead>
                  <TableHead>Subalcance</TableHead>
                  <TableHead>Materiales</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : associateSpecialties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No hay especialidades registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  associateSpecialties.map((spec) => (
                    <TableRow key={spec.id}>
                      <TableCell>{spec.specialty.name}</TableCell>
                      <TableCell>{spec.scope?.name || "-"}</TableCell>
                      <TableCell>{spec.subscope?.name || "-"}</TableCell>
                      <TableCell>{spec.materials || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Eliminar especialidad"
                          onClick={() => handleDelete(spec.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
