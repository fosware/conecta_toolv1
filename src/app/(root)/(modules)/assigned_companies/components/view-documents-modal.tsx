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
import { AssignedCompany } from "../types";

interface Document {
  id: number;
  name: string;
  fileName: string;
  createdAt: string;
  type: string;
}

interface ViewDocumentsModalProps {
  open: boolean;
  onClose: () => void;
  item: AssignedCompany;
  onSuccess?: () => void;
}

export function ViewDocumentsModal({
  open,
  onClose,
  item,
  onSuccess,
}: ViewDocumentsModalProps) {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  useEffect(() => {
    if (open && item) {
      loadDocuments();
    }
  }, [open, item]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assigned_companies/${item.id}/documents`, {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
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

  const handleDownloadDocument = async (documentId: number, fileName: string) => {
    try {
      setDownloadingFile(documentId.toString());
      const response = await fetch(`/api/assigned_companies/${item.id}/documents/${documentId}/download`, {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al descargar el documento");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
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
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Documentos de la Solicitud</DialogTitle>
          <DialogDescription>
            Documentos relacionados con la solicitud de{" "}
            {item.ProjectRequest?.name || item.ProjectRequest?.title || "N/A"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay documentos disponibles para esta solicitud.
            </div>
          ) : (
            <div className="grid gap-4">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center">
                      <File className="h-4 w-4 mr-2" />
                      {doc.name}
                    </CardTitle>
                    <CardDescription>
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {doc.fileName}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc.id, doc.fileName)}
                        disabled={downloadingFile === doc.id.toString()}
                      >
                        {downloadingFile === doc.id.toString() ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Descargar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
