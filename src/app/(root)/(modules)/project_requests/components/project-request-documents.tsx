import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import {
  FileText,
  Download,
  Loader2,
  Upload,
  Trash2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getToken } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Función para formatear la fecha para mostrar
function formatDateForDisplay(dateString: string | Date | undefined): string {
  if (!dateString) return "Fecha no disponible";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Fecha inválida";

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

interface ProjectRequestDocumentsProps {
  projectRequestId: number;
  onDocumentsChanged?: () => void;
}

interface Document {
  id: number;
  documentFileName: string;
  createdAt: string;
}

export function ProjectRequestDocuments({
  projectRequestId,
  onDocumentsChanged,
}: ProjectRequestDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (projectRequestId) {
      loadDocuments();
    }
  }, [projectRequestId]);

  const loadDocuments = async (showLoading = true) => {
    if (!projectRequestId) return;

    if (showLoading) {
      setLoading(true);
    }

    try {
      const response = await fetch(
        `/api/project_requests/${projectRequestId}/documents`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error en la respuesta:", errorData);
        throw new Error(
          `Error al cargar los documentos técnicos: ${errorData.error || response.statusText}`
        );
      }

      const data = await response.json();
      
      // Asegurarse de que documents siempre sea un array
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
    } catch (error) {
      console.error("Error loading technical documents:", error);
      toast.error("Error al cargar los documentos técnicos");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const token = getToken();
      const response = await fetch(
        `/api/project_requests/${projectRequestId}/documents/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Error al subir el documento: ${errorData.error || response.statusText}`
        );
      }

      toast.success("Documento subido correctamente");
      
      // Limpiar el input de archivo
      event.target.value = "";
      
      // Recargar los documentos sin mostrar el indicador de carga
      await loadDocuments(false);
      
      // Indicar que hubo cambios
      setChanged(true);
      
      // Notificar al componente padre si es necesario
      if (onDocumentsChanged) {
        onDocumentsChanged();
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Error al subir el documento");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    if (!projectRequestId) return;

    setDownloading(doc.id);
    try {
      const token = getToken();
      const response = await fetch(
        `/api/project_requests/${projectRequestId}/documents/${doc.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Error al descargar el documento: ${errorData.error || response.statusText}`
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = doc.documentFileName;
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

  const confirmDelete = (documentId: number) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete || !projectRequestId) {
      setDeleteDialogOpen(false);
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(
        `/api/project_requests/${projectRequestId}/documents/${documentToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Error al eliminar el documento: ${errorData.error || response.statusText}`
        );
      }

      toast.success("Documento eliminado correctamente");
      
      // Recargar los documentos sin mostrar el indicador de carga
      await loadDocuments(false);
      
      // Indicar que hubo cambios
      setChanged(true);
      
      // Notificar al componente padre si es necesario
      if (onDocumentsChanged) {
        onDocumentsChanged();
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Error al eliminar el documento");
    } finally {
      setDocumentToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Documentos Técnicos
            </div>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                disabled={uploading}
                onClick={() => document.getElementById("document-upload")?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Subir documento</span>
                  </>
                )}
              </Button>
              <input
                id="document-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
                /*accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"*/
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del documento</TableHead>
                  <TableHead>Fecha de subida</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {doc.documentFileName}
                      </span>
                    </TableCell>
                    <TableCell>
                      {formatDateForDisplay(doc.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          disabled={downloading === doc.id}
                          title="Descargar"
                        >
                          {downloading === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmDelete(doc.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                No hay documentos técnicos disponibles
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Sube un documento utilizando el botón "Subir documento"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el documento seleccionado y no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDocumentToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
