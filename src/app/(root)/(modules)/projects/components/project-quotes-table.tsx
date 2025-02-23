"use client";

import { useState } from "react";
import { ProjectQuote } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { TableSkeleton } from "@/components/table-skeleton";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ProjectQuotesTableProps {
  quotes: ProjectQuote[];
  loading: boolean;
  onReload: () => Promise<void>;
  projectId: number;
  onEdit: (quote: ProjectQuote) => void;
}

export function ProjectQuotesTable({
  quotes,
  loading,
  onReload,
  projectId,
  onEdit,
}: ProjectQuotesTableProps) {
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; quote: ProjectQuote | null }>({
    isOpen: false,
    quote: null,
  });

  const handleDelete = async () => {
    if (!deleteDialog.quote) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/quotes/${deleteDialog.quote.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar la cotización");
      }

      await onReload();
      toast.success("Cotización eliminada correctamente");
      setDeleteDialog({ isOpen: false, quote: null });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar la cotización");
    }
  };

  if (loading) {
    return <TableSkeleton columns={4} rows={5} />;
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) throw new Error("Invalid date");

      return d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      });
    } catch (error) {
      console.error("Error formatting date:", date, error);
      return "Fecha inválida";
    }
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Fecha límite</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No hay cotizaciones registradas
              </TableCell>
            </TableRow>
          ) : (
            quotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell>{quote.company?.companyName}</TableCell>
                <TableCell>{formatDate(quote.deadline)}</TableCell>
                <TableCell>{quote.itemDescription}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar cotización"
                      onClick={() => onEdit(quote)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Eliminar cotización"
                      onClick={() => setDeleteDialog({ isOpen: true, quote })}
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

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(isOpen) => setDeleteDialog({ isOpen, quote: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la cotización de forma permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
