"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { ClientCompanyNDAItem } from "../types/client-company-nda-item";

interface UploadSignedNDAProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ndaItem: ClientCompanyNDAItem | null;
}

export function UploadSignedNDA({
  isOpen,
  onClose,
  onSuccess,
  ndaItem,
}: UploadSignedNDAProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [signedDate, setSignedDate] = useState("");

  // Establecer la fecha actual cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      // Obtener la fecha actual en formato YYYY-MM-DD
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;
      
      setSignedDate(formattedDate);
    }
  }, [isOpen]);

  // Resetear el formulario cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setSignedFile(null);
      setSignedDate("");
    }
  }, [isOpen]);

  if (!ndaItem) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Verificar que el archivo sea un PDF
      if (file.type !== "application/pdf") {
        toast.error("El archivo debe ser un PDF");
        return;
      }
      setSignedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signedFile) {
      toast.error("Debe seleccionar un archivo PDF");
      return;
    }

    if (!signedDate) {
      toast.error("Debe seleccionar una fecha de firma");
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("signedFile", signedFile);
      formData.append("signedDate", signedDate);

      const response = await fetch(
        `/api/client_company_nda/${ndaItem.id}/upload-signed`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al subir el NDA firmado");
      }

      toast.success("NDA firmado subido correctamente");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error uploading signed NDA:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al subir el NDA firmado"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Subir NDA Firmado</DialogTitle>
          <DialogDescription>
            Suba el documento NDA firmado para {ndaItem.clientName} y{" "}
            {ndaItem.companyName}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Cliente
                </h3>
                <p className="text-base font-semibold">{ndaItem.clientName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Asociado
                </h3>
                <p className="text-base font-semibold">{ndaItem.companyName}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Documento NDA Firmado
              </label>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha de Firma</label>
              <Input
                type="date"
                value={signedDate}
                onChange={(e) => setSignedDate(e.target.value)}
                disabled={isSubmitting || !signedFile}
                required
              />
              {!signedFile && (
                <p className="text-sm text-muted-foreground">
                  Primero debe seleccionar un documento NDA firmado
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !signedFile}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Subir NDA Firmado
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
