"use client";

import React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { type ProjectQuote } from "@/types";
import { getToken } from "@/lib/auth";

interface ProjectQuotesTableProps {
  projectId: number;
  quotes: ProjectQuote[];
  onUpdate: (quote: ProjectQuote) => void;
  onEdit: (quote: ProjectQuote) => void;
}

export default function ProjectQuotesTable({
  projectId,
  quotes,
  onUpdate,
  onEdit,
}: ProjectQuotesTableProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    quote: ProjectQuote | null;
  }>({
    isOpen: false,
    quote: null,
  });

  const handleDelete = async () => {
    if (!deleteDialog.quote) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/projects/${projectId}/quotes/${deleteDialog.quote.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar la cotización");
      }

      const deletedQuote = await response.json();
      onUpdate(deletedQuote);
      toast.success("Cotización eliminada correctamente");
    } catch (error) {
      console.error("[QUOTE_DELETE]", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al eliminar la cotización"
      );
    } finally {
      setIsLoading(false);
      setDeleteDialog({ isOpen: false, quote: null });
    }
  };

  const formatDate = (date: Date | string) => {
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
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Fecha límite</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.map((quote) => (
            <TableRow key={quote.id}>
              <TableCell>{quote.company.companyName}</TableCell>
              <TableCell>{quote.itemDescription}</TableCell>
              <TableCell>{formatDate(quote.deadline)}</TableCell>
              <TableCell className="flex justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(quote)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isLoading}
                  onClick={() =>
                    setDeleteDialog({ isOpen: true, quote })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteDialog({ isOpen, quote: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la cotización de forma permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoading}
              onClick={handleDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
