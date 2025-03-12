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
import { AssignedCompany } from "../types";

interface UploadNDAModalProps {
  open: boolean;
  onClose: () => void;
  item: AssignedCompany;
  onSuccess: () => void;
}

export function UploadNDAModal({
  open,
  onClose,
  item,
  onSuccess,
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
    if (!item.ndaFile) {
      toast.error("No hay un NDA disponible para descargar");
      return;
    }

    try {
      setDownloadingNda(true);
      const response = await fetch(`/api/assigned_companies/${item.id}/download-nda`, {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al descargar el NDA");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.ndaFileName || "nda.pdf";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ndaFile) {
      toast.error("Por favor, selecciona un archivo");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("ndaSignedFile", ndaFile);

      const response = await fetch(`/api/assigned_companies/${item.id}/upload-nda`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al subir el NDA");
      }

      toast.success("NDA subido correctamente");
      onSuccess();
    } catch (error) {
      console.error("Error uploading NDA:", error);
      toast.error("Error al subir el NDA");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNda = async () => {
    if (!item.ndaSignedFile) {
      toast.error("No hay un NDA firmado para eliminar");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/assigned_companies/${item.id}/delete-signed-nda`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar el NDA firmado");
      }

      toast.success("NDA firmado eliminado correctamente");
      setDeleteDialogOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error deleting signed NDA:", error);
      toast.error("Error al eliminar el NDA firmado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Subir NDA Firmado</DialogTitle>
            <DialogDescription>
              Sube el NDA firmado para la solicitud de{" "}
              {item.ProjectRequest?.name || item.ProjectRequest?.title || "N/A"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {item.ndaFile && (
                <div>
                  <Label>NDA Original</Label>
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-muted-foreground mr-2">
                      {item.ndaFileName || "nda.pdf"}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadNda}
                      disabled={downloadingNda}
                    >
                      {downloadingNda ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      Descargar
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="nda-file">NDA Firmado</Label>
                <div className="flex items-center mt-1">
                  <Input
                    id="nda-file"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    className="flex-1"
                  />
                </div>
                {item.ndaSignedFile && (
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-muted-foreground mr-2">
                      Archivo actual: {item.ndaSignedFileName || "nda-firmado.pdf"}
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      Eliminar
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !ndaFile}>
                {loading ? (
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el NDA firmado y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNda} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
