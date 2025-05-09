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
import { FileText, Download, Loader2, FileCheck } from "lucide-react";
import { AssignedCompany } from "@/lib/schemas/assigned_company";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  documentFileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
  documentTypeId?: number;
  documentType?: DocumentType;
}

interface Quotation {
  id: number;
  quotationFileName?: string;
  createdAt: string;
}

export function ViewDocumentsDialog({
  open,
  onOpenChange,
  item,
}: ViewDocumentsDialogProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingQuotation, setLoadingQuotation] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [downloadingQuotation, setDownloadingQuotation] = useState(false);

  useEffect(() => {
    if (open && item?.id) {
      loadDocuments();
      loadQuotation();
    }
  }, [open, item?.id]);

  const loadDocuments = async () => {
    if (!item?.id) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/assigned_companies/${item.id}/documents`
      );

      if (!response.ok) {
        throw new Error("Error al cargar los documentos");
      }

      const data = await response.json();
      // Asegurarse de que documents siempre sea un array y transformar los nombres si es necesario
      const formattedDocuments = (Array.isArray(data.documents) ? data.documents : []).map((doc: any) => ({
        ...doc,
        // Asegurar que tengamos un nombre de archivo para mostrar
        documentFileName: doc.documentFileName || `Documento ${doc.id}`
      }));
      setDocuments(formattedDocuments);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Error al cargar los documentos");
    } finally {
      setLoading(false);
    }
  };

  const loadQuotation = async () => {
    if (!item?.id) return;

    setLoadingQuotation(true);
    try {
      const response = await fetch(
        `/api/assigned_companies/${item.id}/quotation-info`
      );

      if (!response.ok) {
        // Si no hay cotización, no es un error, simplemente no hay datos
        if (response.status === 404) {
          setQuotation(null);
          return;
        }
        throw new Error("Error al cargar la cotización");
      }

      const data = await response.json();
      setQuotation(data || null);
    } catch (error) {
      console.error("Error loading quotation:", error);
      // No mostrar toast de error si simplemente no hay cotización
    } finally {
      setLoadingQuotation(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      setDownloading(document.id);

      const response = await fetch(
        `/api/assigned_companies/${item.id}/documents/${document.id}/download`
      );

      if (!response.ok) {
        throw new Error("Error al descargar el documento");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.documentFileName || `documento_${document.id}.pdf`;
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

  const handleDownloadQuotation = async () => {
    if (!quotation || !item?.id) return;

    try {
      setDownloadingQuotation(true);

      const response = await fetch(
        `/api/assigned_companies/${item.id}/download-quote`
      );

      if (!response.ok) {
        throw new Error("Error al descargar la cotización");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = window.document.createElement("a");
      a.href = url;
      a.download = quotation.quotationFileName || `cotizacion_${quotation.id}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading quotation:", error);
      toast.error("Error al descargar la cotización");
    } finally {
      setDownloadingQuotation(false);
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
            Documentos disponibles para{" "}
            {item?.Company?.comercialName || item?.Company?.companyName || "N/A"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="technical" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="technical">Documentos Técnicos</TabsTrigger>
            <TabsTrigger value="quotation">Cotización</TabsTrigger>
          </TabsList>
          
          <TabsContent value="technical" className="min-h-[300px]">
            {loading ? (
              <div className="flex justify-center items-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <FileText className="h-12 w-12 mb-2 opacity-20" />
                <p>No hay documentos técnicos disponibles</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead className="w-[100px] text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="font-medium">
                        {document.documentFileName}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(document)}
                          disabled={downloading === document.id}
                        >
                          {downloading === document.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
          
          <TabsContent value="quotation" className="min-h-[300px]">
            {loadingQuotation ? (
              <div className="flex justify-center items-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : !quotation ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <FileCheck className="h-12 w-12 mb-2 opacity-20" />
                <p>No hay cotización disponible</p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="flex justify-between items-center p-4 border rounded-md">
                  <div className="flex items-center space-x-2">
                    <FileCheck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{quotation.quotationFileName || "Cotización"}</p>
                      <p className="text-sm text-muted-foreground">
                        Subido el {new Date(quotation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadQuotation}
                    disabled={downloadingQuotation}
                    className="flex items-center space-x-1"
                  >
                    {downloadingQuotation ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        <span>Descargando...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-1" />
                        <span>Descargar</span>
                      </>
                    )}
                  </Button>
                </div>
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
