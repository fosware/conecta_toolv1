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
import { Edit, Trash2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import clsx from "clsx";
import { Switch } from "@/components/ui/switch";

interface Especialidad {
  id: number;
  num: string;
  name: string;
  isActive: boolean;
}

interface Props {
  especialidades: Especialidad[];
  selectedId?: number;
  onSelect: (especialidad: Especialidad) => void;
  onRefresh: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CatEspecialidadesTable({
  especialidades,
  onSelect,
  onRefresh,
  selectedId,
  currentPage,
  totalPages,
  onPageChange,
}: Props) {
  const handleToggleStatus = async (id: number) => {
    try {
      const response = await fetch(`/cat_especialidades/api/${id}/toggle-status`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el estado");
      }

      onRefresh();
      toast.success("Estado actualizado correctamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar el estado de la especialidad");
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
            {especialidades.map((especialidad) => (
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
                    onCheckedChange={(checked) => {}}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(especialidad.id);
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
                        onSelect(especialidad);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(especialidad);
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
