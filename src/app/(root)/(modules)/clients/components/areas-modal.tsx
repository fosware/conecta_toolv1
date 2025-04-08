import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
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
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { type Client, type ClientArea } from "@/lib/schemas/client";
import AreasTable from "./areas-table";
import { AreaForm } from "./area-form";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";

interface AreasModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client;
  editingArea?: ClientArea;
  onAreasUpdated?: (clientId: number, areas: ClientArea[]) => void;
}

export const AreasModal = ({
  isOpen,
  onClose,
  client,
  editingArea,
  onAreasUpdated,
}: AreasModalProps) => {
  const [areas, setAreas] = useState<ClientArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaForm, setAreaForm] = useState<{
    isOpen: boolean;
    area: ClientArea | undefined;
  }>({
    isOpen: false,
    area: undefined,
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    area: ClientArea | undefined;
  }>({
    isOpen: false,
    area: undefined,
  });

  useEffect(() => {
    if (isOpen && client) {
      loadAreas();
    } else {
      setAreas([]);
    }
  }, [isOpen, client]);

  useEffect(() => {
    if (editingArea && isOpen) {
      setAreaForm({
        isOpen: true,
        area: editingArea,
      });
    }
  }, [editingArea, isOpen]);

  const loadAreas = async () => {
    if (!client) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${client.id}/areas`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      setAreas(data);
      // Notificar al componente padre que las áreas han sido actualizadas
      onAreasUpdated?.(client.id, data);
    } catch (error) {
      console.error("[LOAD_AREAS]", error);
      toast.error("Error al cargar las áreas");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArea = async (data: Partial<ClientArea>) => {
    if (!client) return;

    try {
      // Actualización optimista
      const newArea = {
        ...data,
        id: Date.now(), // ID temporal
        clientId: client.id,
        isActive: true,
        isDeleted: false,
        dateDeleted: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ClientArea;

      setAreas((prev) => [...prev, newArea]);

      const response = await fetch(`/api/clients/${client.id}/areas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ ...data, clientId: client.id }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      // Recargar para obtener el ID real y datos actualizados
      await loadAreas();
      setAreaForm({ isOpen: false, area: undefined });
      toast.success("Área creada correctamente");
    } catch (error: any) {
      // Rollback
      setAreas((prev) => prev.filter((a) => typeof a.id === "number"));
      toast.error(error.message || "Error al crear el área");
      throw error;
    }
  };

  const handleUpdateArea = async (data: Partial<ClientArea>) => {
    if (!client || !areaForm.area) return;

    try {
      // Actualización optimista
      setAreas((prev) =>
        prev.map((area) =>
          area.id === areaForm.area?.id ? { ...area, ...data } : area
        )
      );

      const response = await fetch(
        `/api/clients/${client.id}/areas/${areaForm.area.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      // Recargar para obtener datos actualizados
      await loadAreas();
      setAreaForm({ isOpen: false, area: undefined });
      toast.success("Área actualizada correctamente");
    } catch (error: any) {
      // Rollback
      await loadAreas();
      toast.error(error.message || "Error al actualizar el área");
      throw error;
    }
  };

  const handleDeleteArea = async (area: ClientArea) => {
    if (!client) return;

    try {
      // Actualización optimista
      setAreas((prev) => prev.filter((a) => a.id !== area.id));

      const response = await fetch(
        `/api/clients/${client.id}/areas/${area.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) throw new Error();

      // Ya no necesitamos llamar a onAreasUpdated aquí porque loadAreas lo hará
      await loadAreas();
      toast.success("Área eliminada correctamente");
      setDeleteDialog({ isOpen: false, area: undefined });
    } catch (error) {
      // Rollback
      await loadAreas();
      toast.error("Error al eliminar el área");
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    if (!client) return;

    try {
      // Actualización optimista
      setAreas((prev) =>
        prev.map((area) =>
          area.id === id ? { ...area, isActive: !currentStatus } : area
        )
      );

      const response = await fetch(`/api/clients/${client.id}/areas/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) throw new Error();

      // Ya no necesitamos llamar a onAreasUpdated aquí porque loadAreas lo hará
      await loadAreas();
      toast.success(
        `Área ${!currentStatus ? "habilitada" : "inhabilitada"} correctamente`
      );
    } catch (error) {
      // Rollback
      setAreas((prev) =>
        prev.map((area) =>
          area.id === id ? { ...area, isActive: currentStatus } : area
        )
      );
      toast.error("Error al actualizar el estado");
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Áreas/Direcciones - {client?.name}</DialogTitle>
          </DialogHeader>

          <div className="flex justify-end">
            <Button
              onClick={() => setAreaForm({ isOpen: true, area: undefined })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Área
            </Button>
          </div>

          <AreasTable
            areas={areas}
            isLoading={loading}
            onEdit={(area) => setAreaForm({ isOpen: true, area })}
            onDelete={(area) => setDeleteDialog({ isOpen: true, area })}
            onToggleStatus={handleToggleStatus}
          />
        </DialogContent>
      </Dialog>

      <AreaForm
        isOpen={areaForm.isOpen}
        onClose={() => setAreaForm({ isOpen: false, area: undefined })}
        onSubmit={areaForm.area ? handleUpdateArea : handleCreateArea}
        initialData={areaForm.area}
      />

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteDialog({
            isOpen,
            area: isOpen ? deleteDialog.area : undefined,
          })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el área "{deleteDialog.area?.areaName}".
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setDeleteDialog({ isOpen: false, area: undefined })
              }
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.area && handleDeleteArea(deleteDialog.area)
              }
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AreasModal;
