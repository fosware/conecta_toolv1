"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { Loader2, FileText, Download, File } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ViewDocumentsModalProps {
  open: boolean;
  onClose: () => void;
  projectRequestCompany: any;
}

export function ViewDocumentsModal({
  open,
  onClose,
  projectRequestCompany,
}: ViewDocumentsModalProps) {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  useEffect(() => {
    if (open && projectRequestCompany) {
      loadDocuments();
    }
  }, [open, projectRequestCompany]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assigned_companies/${projectRequestCompany.id}/documents`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los documentos");
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Error al cargar los documentos");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadNda = async () => {
    if (!projectRequestCompany.ndaSignedFile) {
      toast.error("No hay un NDA firmado disponible para descargar");
      return;
    }

    try {
      setDownloadingFile("nda");
      const response = await fetch(`/api/assigned_companies/${projectRequestCompany.id}/download-signed-nda`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al descargar el NDA firmado");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = projectRequestCompany.ndaSignedFileName || "nda-firmado.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading signed NDA:", error);
      toast.error("Error al descargar el NDA firmado");
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleDownloadDocument = async (documentId: number, fileName: string) => {
    try {
      setDownloadingFile(`doc-${documentId}`);
      const response = await fetch(`/api/assigned_companies/${projectRequestCompany.id}/documents/${documentId}/download`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al descargar el documento");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || `documento-${documentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Error al descargar el documento");
    } finally {
      setDownloadingFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Documentos del Proyecto</DialogTitle>
          <DialogDescription>
            Documentos relacionados con la solicitud de proyecto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* NDA Firmado */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">NDA Firmado</CardTitle>
            </CardHeader>
            <CardContent>
              {projectRequestCompany.ndaSignedFile ? (
                <Button
                  variant="outline"
                  onClick={handleDownloadNda}
                  disabled={downloadingFile === "nda"}
                  className="w-full"
                >
                  {downloadingFile === "nda" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  {projectRequestCompany.ndaSignedFileName || "NDA Firmado"}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">No hay NDA firmado disponible</p>
              )}
            </CardContent>
          </Card>

          {/* Documentos Técnicos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Documentos Técnicos</CardTitle>
              <CardDescription>
                Documentos proporcionados por el cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay documentos técnicos disponibles
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <Button
                      key={doc.id}
                      variant="outline"
                      onClick={() => handleDownloadDocument(doc.id, doc.documentFileName)}
                      disabled={downloadingFile === `doc-${doc.id}`}
                      className="w-full flex justify-between items-center"
                    >
                      <div className="flex items-center">
                        {downloadingFile === `doc-${doc.id}` ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <File className="h-4 w-4 mr-2" />
                        )}
                        <span className="truncate max-w-[200px]">
                          {doc.documentFileName || `Documento ${doc.id}`}
                        </span>
                      </div>
                      <Download className="h-4 w-4 ml-2" />
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
