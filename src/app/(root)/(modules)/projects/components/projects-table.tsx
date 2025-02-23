"use client";

import { type Project } from "@/types";
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
import {
  Pencil,
  Quote,
  Edit,
  FileText,
  Trash2,
  ReceiptText,
} from "lucide-react";
import { TableSkeleton } from "@/components/table-skeleton";

interface ProjectsTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onToggleStatus: (project: Project) => void;
  onQuotes: (project: Project) => void;
}

export function ProjectsTable({
  projects,
  onEdit,
  onDelete,
  onToggleStatus,
  onQuotes,
}: ProjectsTableProps) {
  if (!projects?.length) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">No hay proyectos disponibles</p>
      </div>
    );
  }

  console.log("Renderizando proyectos en tabla:", projects); // Debug

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Área</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>{project.name}</TableCell>
              <TableCell>{project.client?.name}</TableCell>
              <TableCell>{project.clientArea?.areaName}</TableCell>
              <TableCell>{project.projectType?.name}</TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={project.isActive}
                  onCheckedChange={() => onToggleStatus(project)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Editar proyecto"
                    onClick={() => onEdit(project)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Generar cotización"
                    onClick={() => onQuotes(project)}
                  >
                    <ReceiptText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Eliminar proyecto"
                    onClick={() => onDelete(project)}
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
  );
}
