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

interface Subalcance {
  id: number;
  name: string;
  num: number;
  scopeId: number;
  isActive: boolean;
  description: string;
}

interface SubalcancesTableProps {
  subalcances: Subalcance[];
  onEdit: (subalcance: Subalcance) => void;
  onDelete: (subalcance: Subalcance) => void;
  onToggleStatus: (subalcance: Subalcance) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelect: (subalcance: Subalcance) => void;
  selectedId: number;
}

export function CatSubalcancesTable({
  subalcances,
  onEdit,
  onDelete,
  onToggleStatus,
  currentPage,
  totalPages,
  onPageChange,
  onSelect,
  selectedId,
}: SubalcancesTableProps) {
  const handleToggleStatus = async (id: number) => {
    try {
      const response = await fetch(`/cat_especialidades/api/subalcances/${id}/toggle-status`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el estado");
      }

      onToggleStatus({
        id,
        isActive: !subalcances.find((subalcance) => subalcance.id === id).isActive,
      });
      toast.success("Estado actualizado correctamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar el estado del subalcance");
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
            {subalcances.map((subalcance) => (
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
                    onCheckedChange={(checked) => {}}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(subalcance.id);
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(subalcance);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
