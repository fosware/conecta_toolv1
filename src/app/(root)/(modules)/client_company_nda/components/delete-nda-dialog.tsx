"use client";

import React, { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { ClientCompanyNDAItem } from "../types/client-company-nda-item";

interface DeleteNDADialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ndaItem: ClientCompanyNDAItem | null;
}

export function DeleteNDADialog({
  isOpen,
  onClose,
  onSuccess,
  ndaItem,
}: DeleteNDADialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!ndaItem) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/client_company_nda/${ndaItem.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar el NDA");
      }

      toast.success("NDA eliminado correctamente");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error deleting NDA:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar el NDA");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente el NDA entre{" "}
            <strong>{ndaItem?.clientName}</strong> y{" "}
            <strong>{ndaItem?.companyName}</strong>. Esta acción no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
