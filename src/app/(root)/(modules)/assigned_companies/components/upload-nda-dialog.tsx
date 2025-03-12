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
import { Loader2, Upload } from "lucide-react";
import { AssignedCompany } from "@/lib/schemas/assigned_company";
import { toast } from "sonner";

interface UploadNdaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AssignedCompany;
  onSuccess: () => void;
}

export function UploadNdaDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: UploadNdaDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Por favor selecciona un archivo");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/assigned_companies/${item.id}/upload-signed-nda`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al subir el NDA firmado");
      }

      toast.success("NDA firmado subido correctamente");
      setFile(null);
      onSuccess();
    } catch (error) {
      console.error("Error uploading signed NDA:", error);
      toast.error("Error al subir el NDA firmado");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Limpiar el estado al cerrar el diálogo
    setFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Subir NDA Firmado</DialogTitle>
          <DialogDescription>
            Sube el NDA firmado por el asociado para la solicitud{" "}
            <strong>{item.ProjectRequest?.title || item.ProjectRequest?.name || "N/A"}</strong>
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
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
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
                  <Upload className="mr-2 h-4 w-4" />
                  Subir NDA
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
