"use client";

import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StaffMember } from "@/types/staff";
import { toast } from "sonner";

interface StaffTableProps {
  data: StaffMember[];
  loading?: boolean;
  onEdit: (staff: StaffMember) => void;
  onDelete: (staff: StaffMember) => void;
  onToggleStatus: (userId: number, currentStatus: boolean) => void;
  companyId: number;
  setLoading: (loading: boolean) => void;
  setData: (data: StaffMember[]) => void;
}

export function StaffTable({
  data,
  loading = false,
  onEdit,
  onDelete,
  onToggleStatus,
  companyId,
  setLoading,
  setData,
}: StaffTableProps) {
  const loadStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/companies/${companyId}/staff`);
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || "Error al cargar el personal");
      }

      setData(responseData.data || []);
    } catch (error) {
      console.error("Error loading staff:", error);
      toast.error("Error al cargar el personal");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-24 flex items-center justify-center">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Puesto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                No hay personal registrado
              </TableCell>
            </TableRow>
          ) : (
            data.map((staff) => (
              <TableRow key={staff.id}>
                <TableCell>{staff.user.profile?.name || "-"}</TableCell>
                <TableCell>{staff.user.username}</TableCell>
                <TableCell>{staff.user.email}</TableCell>
                <TableCell>{staff.user.profile?.phone || "-"}</TableCell>
                <TableCell>{staff.role}</TableCell>
                <TableCell>{staff.position || "-"}</TableCell>
                <TableCell>
                  <Switch
                    checked={staff.user.isActive}
                    onCheckedChange={() =>
                      onToggleStatus(staff.user.id, staff.user.isActive)
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(staff)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(staff)}
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
  );
}
