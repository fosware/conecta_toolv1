"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Especialidad } from "@/types";
import { Pagination } from "@/components/ui/pagination";
import clsx from "clsx";
import { Switch } from "@/components/ui/switch";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Edit, Trash2 } from "lucide-react";
import { getToken } from "@/lib/auth";

interface CatEspecialidadesTableProps {
  especialidades: Especialidad[];
  onDelete: (especialidad: Especialidad) => void;
  onEdit: (especialidad: Especialidad) => void;
  onToggleStatus: (especialidad: Especialidad) => void;
  onSelect: (especialidad: Especialidad) => void;
  selectedId?: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  showActive?: boolean;
}

export function CatEspecialidadesTable({
  especialidades,
  onDelete,
  onEdit,
  onToggleStatus,
  onSelect,
  selectedId,
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  showActive = true,
}: CatEspecialidadesTableProps) {
  const handleToggleStatus = async (id: number) => {
    try {
      const response = await fetch(`/cat_especialidades/api/${id}/toggle-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar el estado");
      }

      onToggleStatus(especialidades.find((especialidad) => especialidad.id === id)!);
      toast.success("Estado actualizado correctamente");
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error al actualizar el estado de la especialidad");
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/cat_especialidades/api`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar la especialidad");
      }

      onDelete(especialidades.find((especialidad) => especialidad.id === id)!);
      toast.success("Especialidad eliminada correctamente");
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error al eliminar la especialidad");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Número</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-[100px]">Estado</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : especialidades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No hay especialidades
                </TableCell>
              </TableRow>
            ) : (
              especialidades.map((especialidad) => (
                <TableRow
                  key={especialidad.id}
                  className={clsx(
                    "cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedId === especialidad.id && "bg-primary/25 hover:bg-primary/35"
                  )}
                  onClick={() => onSelect(especialidad)}
                >
                  <TableCell className="font-medium">{especialidad.num}</TableCell>
                  <TableCell>{especialidad.name}</TableCell>
                  <TableCell>
                    <Switch
                      checked={especialidad.isActive}
                      onCheckedChange={() => {
                        onToggleStatus(especialidad);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(especialidad);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <ConfirmationDialog
                        question="¿Está seguro de eliminar esta especialidad?"
                        onConfirm={() => handleDelete(especialidad.id)}
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
