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
import { FileText, Download, Loader2, FileCheck, Calendar, Info } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ViewQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: number;
  companyName: string;
  requirementId: number;
  requirementName?: string;
}

interface QuotationSegment {
  id: number;
  estimatedDeliveryDate: string;
  description: string;
}

interface Quotation {
  id: number;
  quotationFileName?: string;
  materialCost?: number;
  directCost?: number;
  indirectCost?: number;
  price?: number;
  additionalDetails?: string;
  createdAt?: string;
  QuotationSegment?: QuotationSegment[];
}

export function ViewQuotationDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  requirementId,
  requirementName,
}: ViewQuotationDialogProps) {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (open && companyId) {
      loadQuotation();
    }
  }, [open, companyId]);

  const loadQuotation = async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/assigned_companies/${companyId}/get-quote`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setQuotation(null);
          return;
        }
        throw new Error("Error al cargar la cotización");
      }

      const data = await response.json();
      setQuotation(data.quotation || null);
    } catch (error) {
      console.error("Error loading quotation:", error);
      toast.error("Error al cargar la cotización");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQuotation = async () => {
    try {
      setDownloading(true);

      const response = await fetch(
        `/api/assigned_companies/${companyId}/download-quote`
      );

      if (!response.ok) {
        throw new Error("Error al descargar la cotización");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = window.document.createElement("a");
      a.href = url;
      a.download = quotation?.quotationFileName || `cotizacion_${companyId}.xlsx`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading quotation:", error);
      toast.error("Error al descargar la cotización");
    } finally {
      setDownloading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Formatear número como moneda
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "N/A";
    
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Cotización Detallada</DialogTitle>
          <DialogDescription>
            Cotización de {companyName || "Asociado"} para {requirementName || "Requerimiento"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex justify-center items-center h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !quotation ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
              <FileCheck className="h-12 w-12 mb-2 opacity-20" />
              <p>No hay cotización disponible</p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {/* Costos */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    Detalles de Costos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Costo de Materiales:</p>
                      <p className="font-medium">{formatCurrency(quotation.materialCost)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Costo Directo:</p>
                      <p className="font-medium">{formatCurrency(quotation.directCost)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Costo Indirecto:</p>
                      <p className="font-medium">{formatCurrency(quotation.indirectCost)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Precio Total:</p>
                      <p className="font-medium text-primary">{formatCurrency(quotation.price)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Segmentos de entrega */}
              {quotation.QuotationSegment && quotation.QuotationSegment.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-primary" />
                      Segmentos de Entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha Estimada</TableHead>
                            <TableHead>Descripción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quotation.QuotationSegment.map((segment) => (
                            <TableRow key={segment.id}>
                              <TableCell>{formatDate(segment.estimatedDeliveryDate)}</TableCell>
                              <TableCell>{segment.description}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Observaciones adicionales */}
              {quotation.additionalDetails && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Observaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{quotation.additionalDetails}</p>
                  </CardContent>
                </Card>
              )}
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
  );
}
