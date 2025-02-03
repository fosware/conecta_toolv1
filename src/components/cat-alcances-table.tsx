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
import type { Alcance } from "@/types";
import { Pagination } from "@/components/ui/pagination";
import clsx from "clsx";
import { Switch } from "@/components/ui/switch";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Edit, Trash2 } from "lucide-react";

interface CatAlcancesTableProps {
  alcances: Alcance[];
  onDelete: (alcance: Alcance) => void;
  onEdit: (alcance: Alcance) => void;
  onToggleStatus: (alcance: Alcance) => void;
  onSelect: (alcance: Alcance) => void;
  selectedId?: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  showActive?: boolean;
}

export function CatAlcancesTable({
  alcances,
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
}: CatAlcancesTableProps) {
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/cat_especialidades/api/${id}/alcances`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el alcance");
      }

      onDelete(alcances.find((alcance) => alcance.id === id)!);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar el alcance");
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
            ) : alcances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No hay alcances
                </TableCell>
              </TableRow>
            ) : (
              alcances.map((alcance) => (
                <TableRow
                  key={alcance.id}
                  className={clsx(
                    "cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedId === alcance.id && "bg-primary/25 hover:bg-primary/35"
                  )}
                  onClick={() => onSelect(alcance)}
                >
                  <TableCell className="font-medium">{alcance.num}</TableCell>
                  <TableCell>{alcance.name}</TableCell>
                  <TableCell>
                    <Switch
                      checked={alcance.isActive}
                      onCheckedChange={() => {
                        onToggleStatus(alcance);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(alcance);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <ConfirmationDialog
                        question="¿Está seguro de eliminar este alcance?"
                        onConfirm={() => handleDelete(alcance.id)}
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
