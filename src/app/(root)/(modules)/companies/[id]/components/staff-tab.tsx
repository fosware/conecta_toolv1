"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StaffTable } from "./staff-table";
import { StaffModal } from "./staff-modal";
import { toast } from "sonner";
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
import { StaffMember } from "@/types/staff";

interface StaffTabProps {
  companyId: number;
}

export function StaffTab({ companyId }: StaffTabProps) {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    staff: StaffMember | null;
  }>({
    isOpen: false,
    staff: null,
  });

  const loadStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/companies/${companyId}/staff`);
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || "Error al cargar el personal");
      }

      setStaff(responseData.data || []);
    } catch (error) {
      console.error("Error loading staff:", error);
      toast.error("Error al cargar el personal");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [companyId]);

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/toggle-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Error al cambiar el estado");
      }

      await loadStaff();
      toast.success("Estado actualizado correctamente");
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Error al cambiar el estado");
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.staff) return;

    try {
      const response = await fetch(
        `/api/companies/${companyId}/staff/${deleteDialog.staff.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el miembro del personal");
      }

      await loadStaff();
      toast.success("Miembro del personal eliminado correctamente");
      setDeleteDialog({ isOpen: false, staff: null });
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("Error al eliminar el miembro del personal");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Personal</h2>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Personal
        </Button>
      </div>

      <StaffTable
        loading={loading}
        data={staff}
        onEdit={(staff) => {
          setSelectedStaff(staff);
          setModalOpen(true);
        }}
        onDelete={(staff) => {
          setDeleteDialog({ isOpen: true, staff });
        }}
        onToggleStatus={handleToggleStatus}
      />

      <StaffModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        companyId={companyId}
        staff={selectedStaff}
        onSuccess={() => {
          loadStaff();
          setSelectedStaff(undefined);
        }}
      />

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteDialog({ isOpen, staff: deleteDialog.staff })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El miembro del personal será
              eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
