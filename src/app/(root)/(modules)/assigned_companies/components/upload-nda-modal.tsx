"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { Loader2, FileText, Upload } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface UploadNDAModalProps {
  open: boolean;
  onClose: () => void;
  projectRequestCompany: any;
}

export function UploadNDAModal({
  open,
  onClose,
  projectRequestCompany,
}: UploadNDAModalProps) {
  const [loading, setLoading] = useState(false);
  const [ndaFile, setNdaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadingNda, setDownloadingNda] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNdaFile(e.target.files[0]);
    }
  };

  const handleDownloadNda = async () => {
    if (!projectRequestCompany.ndaFile) {
      toast.error("No hay un NDA disponible para descargar");
      return;
    }

    try {
      setDownloadingNda(true);
      const response = await fetch(`/api/assigned_companies/${projectRequestCompany.id}/download-nda`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al descargar el NDA");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = projectRequestCompany.ndaFileName || "nda.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading NDA:", error);
      toast.error("Error al descargar el NDA");
    } finally {
      setDownloadingNda(false);
    }
  };

  const handleSubmit = async () => {
    if (!ndaFile) {
      toast.error("Por favor, seleccione un archivo");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("ndaSignedFile", ndaFile);

      const response = await fetch(`/api/assigned_companies/${projectRequestCompany.id}/upload-nda`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al subir el NDA firmado");
      }

      toast.success("NDA firmado subido correctamente");
      onClose();
    } catch (error) {
      console.error("Error uploading signed NDA:", error);
      toast.error("Error al subir el NDA firmado");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = () => {
    setNdaFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subir NDA Firmado</DialogTitle>
            <DialogDescription>
              Descargue el NDA, fírmelo y súbalo para continuar con el proceso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>NDA Original</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadNda}
                  disabled={downloadingNda || !projectRequestCompany.ndaFile}
                  className="w-full"
                >
                  {downloadingNda ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Descargar NDA
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nda-file">NDA Firmado</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="nda-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  disabled={loading}
                />
                {ndaFile && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="flex-shrink-0"
                  >
                    ×
                  </Button>
                )}
              </div>
              {ndaFile && (
                <p className="text-sm text-muted-foreground">
                  Archivo seleccionado: {ndaFile.name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !ndaFile}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Subir NDA Firmado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar el archivo seleccionado?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFile}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
