"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { ClientCompanyNDAItem } from "../types/client-company-nda-item";

interface UploadSignedNDAFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ndaItem: ClientCompanyNDAItem | null;
}

export function UploadSignedNDAForm({
  isOpen,
  onClose,
  onSuccess,
  ndaItem,
}: UploadSignedNDAFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [signedDate, setSignedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Verificar que sea un PDF
      if (file.type !== "application/pdf") {
        toast.error("El archivo debe ser un PDF");
        return;
      }
      setSignedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ndaItem) {
      toast.error("No se ha seleccionado un NDA");
      return;
    }

    if (!signedFile) {
      toast.error("Debe seleccionar un archivo PDF firmado");
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
        throw new Error("Error al subir el NDA firmado");
      }

      toast.success("NDA firmado subido correctamente");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error uploading signed NDA:", error);
      toast.error("Error al subir el NDA firmado");
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
            Suba la versión firmada del NDA entre {ndaItem?.clientName} y{" "}
            {ndaItem?.companyName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signedDate">Fecha de Firma</Label>
            <Input
              id="signedDate"
              type="date"
              value={signedDate}
              onChange={(e) => setSignedDate(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signedFile">Documento NDA Firmado</Label>
            <Input
              id="signedFile"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={isSubmitting}
              required
            />
            <p className="text-sm text-muted-foreground">
              Suba un documento PDF con el NDA firmado por ambas partes
            </p>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Subir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
