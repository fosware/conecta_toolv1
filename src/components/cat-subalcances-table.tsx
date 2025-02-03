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
import { Switch } from "@/components/ui/switch";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Subalcance } from "@/types";
import { Pagination } from "@/components/ui/pagination";
import clsx from "clsx";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface CatSubalcancesTableProps {
  subalcances: Subalcance[];
  onDelete: (subalcance: Subalcance) => void;
  onEdit: (subalcance: Subalcance) => void;
  onToggleStatus: (subalcance: Subalcance) => void;
  onSelect: (subalcance: Subalcance) => void;
  selectedId?: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  showActive?: boolean;
}

export function CatSubalcancesTable({
  subalcances,
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
}: CatSubalcancesTableProps) {
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/cat_especialidades/api/${id}/subalcances`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el subalcance");
      }

      onDelete(subalcances.find((subalcance) => subalcance.id === id)!);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar el subalcance");
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
            ) : subalcances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No hay subalcances
                </TableCell>
              </TableRow>
            ) : (
              subalcances.map((subalcance) => (
                <TableRow
                  key={subalcance.id}
                  className={clsx(
                    "cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedId === subalcance.id && "bg-primary/25 hover:bg-primary/35"
                  )}
                  onClick={() => onSelect(subalcance)}
                >
                  <TableCell className="font-medium">{subalcance.num}</TableCell>
                  <TableCell>{subalcance.name}</TableCell>
                  <TableCell>
                    <Switch
                      checked={subalcance.isActive}
                      onCheckedChange={() => {
                        onToggleStatus(subalcance);
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
                          onEdit(subalcance);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <ConfirmationDialog
                        question="¿Está seguro de eliminar este subalcance?"
                        onConfirm={() => handleDelete(subalcance.id)}
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
