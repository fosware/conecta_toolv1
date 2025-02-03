"use client";

import { useState, useEffect, useCallback } from "react";
import { type Associate } from "@/lib/schemas/associate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AssociatesTable } from "./components/associates-table";
import { AssociateModal } from "./components/associate-modal";
import { CertificatesModal } from "./components/certificates-modal";
import { SpecialtiesModal } from "./components/specialties-modal";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

export default function AssociatePage() {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    item: Associate | null;
  }>({
    isOpen: false,
    item: null,
  });
  const [certificatesModal, setCertificatesModal] = useState<{
    isOpen: boolean;
    associateId: number | null;
  }>({
    isOpen: false,
    associateId: null,
  });
  const [specialtiesModal, setSpecialtiesModal] = useState<{
    isOpen: boolean;
    associateId: number | null;
  }>({
    isOpen: false,
    associateId: null,
  });

  const loadAssociates = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Cargando asociados...");
      const params = new URLSearchParams({
        search: searchQuery,
        showActive: showOnlyActive.toString(),
      });

      const response = await fetch(`/api/asociados?${params}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los asociados");
      }

      const data = await response.json();
      console.log("Asociados cargados:", data);
      // Asegurarnos de que cada asociado tenga los campos requeridos
      const associatesWithDefaults = data.items.map(
        (associate: Partial<Associate>) => ({
          ...associate,
          isActive: associate.isActive ?? true,
          isDeleted: associate.isDeleted ?? false,
          shifts: associate.shifts ?? "",
          companyLogo: associate.companyLogo ?? null,
        })
      ) as Associate[];
      setAssociates(associatesWithDefaults);
    } catch (error) {
      console.error("Error loading associates:", error);
      toast.error("Error al cargar los asociados");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, showOnlyActive]);

  useEffect(() => {
    loadAssociates();
  }, [loadAssociates]);

  const handleEdit = (id: number) => {
    const associate = associates.find((a) => a.id === id);
    if (associate) {
      setEditModal({ isOpen: true, item: associate });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/asociados/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el asociado");
      }

      toast.success("Asociado eliminado correctamente");
      loadAssociates();
    } catch (error) {
      console.error("Error deleting associate:", error);
      toast.error("Error al eliminar el asociado");
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      // Actualización optimista
      setAssociates((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: !currentStatus } : a))
      );

      const response = await fetch(`/api/asociados/${id}/toggle-status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        // Revertir en caso de error
        setAssociates((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isActive: currentStatus } : a))
        );
        throw new Error("Error al cambiar el estado del asociado");
      }

      toast.success("Estado actualizado correctamente");
    } catch (error) {
      console.error("Error toggling associate status:", error);
      toast.error("Error al cambiar el estado del asociado");
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">Asociados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex flex-row gap-2 md:gap-4 flex-1">
                  <div className="flex-1">
                    <label
                      htmlFor="search"
                      className="text-sm font-medium mb-2 block"
                    >
                      Buscar
                    </label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Buscar por nombre, contacto o email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 min-w-[300px]"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="h-[40px] flex items-center">
                      <Button
                        onClick={() =>
                          setEditModal({ isOpen: true, item: null })
                        }
                        className="button-primary"
                      >
                        <Plus className="h-4 w-4 md:hidden" />
                        <span className="hidden md:inline">Nuevo Asociado</span>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <div className="h-[40px] flex items-center">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show-active"
                        checked={showOnlyActive}
                        onCheckedChange={setShowOnlyActive}
                      />
                      <Label htmlFor="show-active">Mostrar solo activos</Label>
                    </div>
                  </div>
                </div>
              </div>

              <AssociatesTable
                associates={associates}
                loading={loading}
                onEdit={(associate) => setEditModal({ isOpen: true, item: associate })}
                onManageCertificates={(id) =>
                  setCertificatesModal({ isOpen: true, associateId: id })
                }
                onManageSpecialties={(id) =>
                  setSpecialtiesModal({ isOpen: true, associateId: id })
                }
                showOnlyActive={showOnlyActive}
                onSuccess={loadAssociates}
              />
            </div>
          </CardContent>
        </Card>

        {editModal.isOpen && (
          <AssociateModal
            isOpen={editModal.isOpen}
            onClose={() => setEditModal({ isOpen: false, item: null })}
            onSuccess={() => {
              loadAssociates();
              setEditModal({ isOpen: false, item: null });
            }}
            initialData={editModal.item}
            title={editModal.item ? "Editar Asociado" : "Nuevo Asociado"}
          />
        )}

        {certificatesModal.isOpen && certificatesModal.associateId && (
          <CertificatesModal
            isOpen={certificatesModal.isOpen}
            onClose={() =>
              setCertificatesModal({ isOpen: false, associateId: null })
            }
            associateId={certificatesModal.associateId}
          />
        )}

        {specialtiesModal.isOpen && specialtiesModal.associateId && (
          <SpecialtiesModal
            isOpen={specialtiesModal.isOpen}
            onClose={() => {
              setSpecialtiesModal({ isOpen: false, associateId: null });
              loadAssociates(); // Recargar la tabla después de cerrar el modal
            }}
            associateId={specialtiesModal.associateId}
          />
        )}
      </div>
    </div>
  );
}
