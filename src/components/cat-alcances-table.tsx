"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";
import clsx from "clsx";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface Alcance {
  id: number;
  name: string;
  num: number;
  description?: string;
  specialtyId: number;
  isActive: boolean;
}

interface AlcancesTableProps {
  alcances: Alcance[];
  onEdit: (alcance: Alcance) => void;
  onDelete: (alcance: Alcance) => void;
  onSelect: (alcance: Alcance) => void;
  onToggleStatus: (alcance: Alcance) => void;
  onRefresh: () => void;
  selectedId?: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CatAlcancesTable({
  alcances,
  onEdit,
  onDelete,
  onSelect,
  onToggleStatus,
  onRefresh,
  selectedId,
  currentPage,
  totalPages,
  onPageChange,
}: AlcancesTableProps) {
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/cat_especialidades/api/alcances`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el alcance");
      }

      toast.success("Alcance eliminado correctamente");
      onRefresh();
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
            {alcances.map((alcance) => (
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
            ))}
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
