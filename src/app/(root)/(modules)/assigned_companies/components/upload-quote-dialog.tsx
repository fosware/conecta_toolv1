"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, FileText } from "lucide-react";
import { AssignedCompany } from "@/lib/schemas/assigned_company";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";

interface UploadQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AssignedCompany;
  onSuccess: () => void;
}

export function UploadQuoteDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: UploadQuoteDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleClose = () => {
    // Limpiar el estado al cerrar el diálogo
    if (!uploading) {
      setFile(null);
      onOpenChange(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error("Por favor selecciona un archivo");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/assigned_companies/${item.id}/upload-quote`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al subir la cotización");
      }

      toast.success("Cotización subida correctamente");
      setFile(null);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error uploading quote:", error);
      toast.error(error instanceof Error ? error.message : "Error al subir la cotización");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Subir Cotización</DialogTitle>
          <DialogDescription>
            <strong>
              {item.ProjectRequest?.title || item.ProjectRequest?.name || "N/A"}
            </strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Asociado
              </Label>
              <div className="col-span-3">
                <p className="text-sm">
                  {item.Company?.comercialName || item.Company?.name || "N/A"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file" className="text-right">
                Archivo
              </Label>
              <div className="col-span-3">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos aceptados: PDF, Word, Excel
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!file || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Subir Cotización
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
