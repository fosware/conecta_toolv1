"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface ProjectRequest {
  id: number;
  title: string;
  clientArea: {
    areaName: string;
    client: {
      name: string;
    };
    contactName: string;
  };
  createdAt: string;
  isActive: boolean;
}

interface ProjectRequestListProps {
  data: ProjectRequest[];
  loading: boolean;
  onRefresh: () => void;
  onEdit?: (id: number) => void;
}

const ProjectRequestList = ({ data, loading, onRefresh, onEdit }: ProjectRequestListProps) => {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<number | null>(null);

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await fetch(`/api/project_request/${id}/toggle-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al cambiar el estado");
      }

      toast.success("Estado actualizado correctamente");
      onRefresh();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cambiar el estado");
    }
  };

  const handleDeleteClick = (id: number) => {
    setRequestToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!requestToDelete) return;
    
    try {
      const response = await fetch(`/api/project_request?id=${requestToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar la solicitud");
      }

      toast.success("Solicitud eliminada correctamente");
      onRefresh();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar la solicitud");
    } finally {
      setDeleteDialogOpen(false);
      setRequestToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div>
          <div className="flex items-center space-x-4 mb-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">
            No hay solicitudes de proyecto registradas.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.title}</TableCell>
                    <TableCell>{request.clientArea?.client?.name || "N/A"}</TableCell>
                    <TableCell>{request.clientArea?.areaName || "N/A"}</TableCell>
                    <TableCell>{request.clientArea?.contactName || "N/A"}</TableCell>
                    <TableCell>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={request.isActive}
                        onCheckedChange={() => handleToggleStatus(request.id)}
                        aria-label="Cambiar estado"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Editar solicitud"
                          onClick={() => onEdit?.(request.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Eliminar"
                          onClick={() => handleDeleteClick(request.id)}
                          className="text-red-500 hover:text-red-600"
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

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La solicitud será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectRequestList;
