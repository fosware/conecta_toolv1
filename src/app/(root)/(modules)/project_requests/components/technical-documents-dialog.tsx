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

interface TechnicalDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: number;
  requirementId: number;
  companyName: string;
  onDocumentsChanged?: () => void;
}

interface Document {
  id: number;
  documentFileName: string;
  createdAt: string;
}

export function TechnicalDocumentsDialog({
  open,
  onOpenChange,
  companyId,
  requirementId,
  companyName,
  onDocumentsChanged,
}: TechnicalDocumentsDialogProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (open && companyId && requirementId) {
      loadDocuments();
    }
  }, [open, companyId, requirementId]);

  const loadDocuments = async (showLoading = true) => {
    if (!companyId || !requirementId) return;

    if (showLoading) {
      setLoading(true);
    }

    try {
      //console.log(`Intentando cargar documentos para compañía ${companyId} y requerimiento ${requirementId}`);
      const response = await fetch(
        `/api/project_requests/companies/${companyId}/requirements/${requirementId}/documents`
      );

      //console.log(`Respuesta recibida con status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error en la respuesta:", errorData);
        throw new Error(
          `Error al cargar los documentos técnicos: ${errorData.error || response.statusText}`
        );
      }

      const data = await response.json();
      //console.log("Datos recibidos:", data);

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
    formData.append("file", file); // Cambiar "document" a "file" para que coincida con el backend

    //console.log("Enviando archivo:", {
    //  name: file.name,
    //  type: file.type,
    //  size: file.size
    //});

    setUploading(true);
    try {
      const response = await fetch(
        `/api/project_requests/companies/${companyId}/requirements/${requirementId}/documents/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al subir el documento");
      }

      toast.success("Documento subido correctamente");
      // Recargar documentos sin mostrar el indicador de carga completo
      loadDocuments(false);
      setChanged(true);

      // Notificar inmediatamente al componente padre para actualizar el estado
      if (onDocumentsChanged) {
        onDocumentsChanged();
      }
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast.error(error.message || "Error al subir el documento");
    } finally {
      setUploading(false);
      // Limpiar el input de archivo
      event.target.value = "";
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      setDownloading(document.id);

      const response = await fetch(
        `/api/project_requests/companies/${companyId}/requirements/${requirementId}/documents/${document.id}/download`
      );

      if (!response.ok) {
        throw new Error("Error al descargar el documento");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.documentFileName;
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
    if (!documentToDelete) return;

    setDeleteDialogOpen(false);

    try {
      const response = await fetch(
        `/api/project_requests/companies/${companyId}/requirements/${requirementId}/documents/${documentToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el documento");
      }

      toast.success("Documento eliminado correctamente");
      // Recargar documentos sin mostrar el indicador de carga completo
      loadDocuments(false);
      setChanged(true);

      // Notificar inmediatamente al componente padre para actualizar el estado
      if (onDocumentsChanged) {
        onDocumentsChanged();
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Error al eliminar el documento");
    } finally {
      setDocumentToDelete(null);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    if (changed && onDocumentsChanged) {
      onDocumentsChanged();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Documentos Técnicos</DialogTitle>
            <DialogDescription>
              Documentos técnicos para {companyName}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Documentos</h3>
              <div className="relative">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={uploading}
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>Subir documento</span>
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                />
              </div>
            </div>

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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
