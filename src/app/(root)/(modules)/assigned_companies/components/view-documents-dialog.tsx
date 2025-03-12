"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Loader2 } from "lucide-react";
import { AssignedCompany } from "@/lib/schemas/assigned_company";
import { toast } from "sonner";

interface ViewDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AssignedCompany;
}

interface DocumentType {
  id: number;
  name: string;
}

interface Document {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  documentTypeId: number;
  documentType?: DocumentType;
}

export function ViewDocumentsDialog({
  open,
  onOpenChange,
  item,
}: ViewDocumentsDialogProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    if (open && item?.id) {
      loadDocuments();
    }
  }, [open, item?.id]);

  const loadDocuments = async () => {
    if (!item?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/assigned_companies/${item.id}/documents`);
      
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

  const handleDownload = async (document: Document) => {
    try {
      setDownloading(document.id);
      
      const response = await fetch(`/api/assigned_companies/${item.id}/documents/${document.id}/download`);
      
      if (!response.ok) {
        throw new Error("Error al descargar el documento");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Usar window.document en lugar de document para evitar confusión con la interfaz Document
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.fileName;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Error al descargar el documento");
    } finally {
      setDownloading(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Documentos</DialogTitle>
          <DialogDescription>
            Documentos relacionados con la solicitud{" "}
            <strong>{item?.ProjectRequest?.title || item?.ProjectRequest?.name || "N/A"}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="nda">NDA</TabsTrigger>
            <TabsTrigger value="other">Otros</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="min-h-[300px]">
            {loading ? (
              <div className="flex justify-center items-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <FileText className="h-12 w-12 mb-2 opacity-20" />
                <p>No hay documentos disponibles</p>
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.fileSize)} • {formatDate(doc.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      disabled={downloading === doc.id}
                    >
                      {downloading === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="nda" className="min-h-[300px]">
            {loading ? (
              <div className="flex justify-center items-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {item?.ndaFileName && (
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{item.ndaFileName}</p>
                        <p className="text-xs text-muted-foreground">
                          NDA Original
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Lógica para descargar NDA original
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {item?.ndaSignedFileName && (
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{item.ndaSignedFileName}</p>
                        <p className="text-xs text-muted-foreground">
                          NDA Firmado • {item.ndaSignedAt ? formatDate(item.ndaSignedAt) : "Fecha desconocida"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Lógica para descargar NDA firmado
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {!item?.ndaFileName && !item?.ndaSignedFileName && (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <FileText className="h-12 w-12 mb-2 opacity-20" />
                    <p>No hay documentos NDA disponibles</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="other" className="min-h-[300px]">
            {loading ? (
              <div className="flex justify-center items-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : documents.filter(d => d.documentTypeId !== 1).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <FileText className="h-12 w-12 mb-2 opacity-20" />
                <p>No hay otros documentos disponibles</p>
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                {documents
                  .filter(d => d.documentTypeId !== 1)
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.documentType?.name || "Documento"} • {formatFileSize(doc.fileSize)} • {formatDate(doc.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        disabled={downloading === doc.id}
                      >
                        {downloading === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
