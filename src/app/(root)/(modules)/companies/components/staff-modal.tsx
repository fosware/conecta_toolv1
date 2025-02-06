"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AddStaffModal } from "./add-staff-modal";
import { StaffTable } from "./staff-table";
import { toast } from "sonner";
import { StaffMember } from "@/types/staff";
import { getToken } from "@/lib/auth";

interface StaffModalProps {
  open: boolean;
  onClose: () => void;
  companyId: number;
  companyName: string;
}

export function StaffModal({ open, onClose, companyId, companyName }: StaffModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | undefined>();

  const loadStaff = async () => {
    if (!companyId) return;

    try {
      const token = getToken();
      if (!token) {
        toast.error("No autorizado - Por favor inicie sesión nuevamente");
        router.push("/login");
        return;
      }

      setLoading(true);
      const response = await fetch(`/api/companies/${companyId}/staff`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("No autorizado - Por favor inicie sesión nuevamente");
          router.push("/login");
          return;
        }
        throw new Error("Error al cargar el personal");
      }

      const responseData = await response.json();
      setStaff(responseData.data || []);
    } catch (error) {
      console.error("Error loading staff:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar el personal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && companyId) {
      loadStaff();
    }
  }, [open, companyId]);

  const handleEditStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setAddModalOpen(true);
  };

  const handleDeleteStaff = async (staff: StaffMember) => {
    try {
      const token = getToken();
      if (!token) {
        toast.error("No autorizado - Por favor inicie sesión nuevamente");
        router.push("/login");
        return;
      }

      setLoading(true);
      const response = await fetch(
        `/api/companies/${companyId}/staff/${staff.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("No autorizado - Por favor inicie sesión nuevamente");
          router.push("/login");
          return;
        }
        throw new Error("Error al eliminar el miembro del personal");
      }

      toast.success("Personal eliminado correctamente");
      loadStaff();
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar el personal");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const token = getToken();
      if (!token) {
        toast.error("No autorizado - Por favor inicie sesión nuevamente");
        router.push("/login");
        return;
      }

      const newStatus = !currentStatus;
      console.log('Toggling status for user:', {
        userId,
        currentStatus,
        newStatus
      });

      // Actualización optimista del estado
      setStaff(prev => prev.map(item => 
        item.user.id === userId ? { ...item, user: { ...item.user, isActive: newStatus } } : item
      ));

      const response = await fetch(
        `/api/companies/${companyId}/staff/${userId}/toggle-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ isActive: newStatus }),
        }
      );

      const responseData = await response.json();
      console.log('Toggle status response:', responseData);

      if (!response.ok) {
        // Revertir el cambio en caso de error
        setStaff(prev => prev.map(item => 
          item.user.id === userId ? { ...item, user: { ...item.user, isActive: currentStatus } } : item
        ));

        if (response.status === 401) {
          toast.error("No autorizado - Por favor inicie sesión nuevamente");
          router.push("/login");
          return;
        }

        if (response.status === 404) {
          toast.error("Usuario no encontrado en la compañía");
          loadStaff(); // Recargar datos para sincronizar
          return;
        }

        if (response.status === 400) {
          toast.error(responseData.error);
          return;
        }

        throw new Error(responseData.error || "Error al actualizar el estado");
      }

      // Actualizar el estado con los datos del servidor
      setStaff(prev => prev.map(item => 
        item.user.id === userId ? { ...item, user: { ...item.user, ...responseData.data } } : item
      ));

      toast.success(responseData.message || "Estado actualizado correctamente");
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Error al actualizar el estado");
      loadStaff(); // Recargar datos para sincronizar en caso de error
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Personal de {companyName}</DialogTitle>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button
            onClick={() => {
              setSelectedStaff(undefined);
              setAddModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Personal
          </Button>
        </div>

        <StaffTable
          data={staff}
          loading={loading}
          onEdit={handleEditStaff}
          onDelete={handleDeleteStaff}
          onToggleStatus={handleToggleStatus}
          companyId={companyId}
          setLoading={setLoading}
          setData={setStaff}
        />

        <AddStaffModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          companyId={companyId}
          staff={selectedStaff}
          onSuccess={loadStaff}
        />
      </DialogContent>
    </Dialog>
  );
}
