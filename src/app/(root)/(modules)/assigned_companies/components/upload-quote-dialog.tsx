"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { AssignedCompany } from "@/lib/schemas/assigned_company";
import { Loader2, FileText } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

interface ProjectType {
  id: number;
  name: string;
}

interface QuotationSegment {
  id?: number;
  estimatedDeliveryDate: string;
  description: string;
}

interface UploadQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AssignedCompany;
  onSuccess: () => void;
}

export function UploadQuoteDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: UploadQuoteDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [materialCost, setMaterialCost] = useState<string>("");
  const [directCost, setDirectCost] = useState<string>("");
  const [indirectCost, setIndirectCost] = useState<string>("");
  const [additionalDetails, setAdditionalDetails] = useState<string>("");
  const [segments, setSegments] = useState<any[]>([]);
  const [newSegmentDate, setNewSegmentDate] = useState<string>("");
  const [newSegmentDescription, setNewSegmentDescription] = useState<string>("");
  const [isSegmented, setIsSegmented] = useState<boolean>(false);
  const [singleDeliveryDate, setSingleDeliveryDate] = useState<string>("");
  const [singleDescription, setSingleDescription] = useState<string>("");
  const [existingQuotation, setExistingQuotation] = useState<any>(null);
  const [existingFileName, setExistingFileName] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [segmentToDeleteIndex, setSegmentToDeleteIndex] = useState<number | null>(null);
  const [editingSegmentIndex, setEditingSegmentIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open && item) {
      if (item.id) {
        loadExistingQuote(item.id);
      }
    }
  }, [open, item]);

  const loadExistingQuote = async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assigned_companies/${id}/get-quote`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.quotation) {
          setExistingQuotation(true);
          setExistingFileName(data.quotation.quotationFileName || "");
          setMaterialCost(data.quotation.materialCost?.toString() || "");
          setDirectCost(data.quotation.directCost?.toString() || "");
          setIndirectCost(data.quotation.indirectCost?.toString() || "");
          setAdditionalDetails(data.quotation.additionalDetails || "");
          
          // Establecer el tipo de cotización basado en projectTypesId
          const isSegmentedQuote = data.quotation.projectTypesId === 2;
          setIsSegmented(isSegmentedQuote);
          
          // Cargar los segmentos
          if (data.quotation.QuotationSegment && data.quotation.QuotationSegment.length > 0) {
            // Mapear los segmentos para el formato correcto
            const mappedSegments = data.quotation.QuotationSegment.map((segment: any) => ({
              id: segment.id,
              estimatedDeliveryDate: new Date(segment.estimatedDeliveryDate).toISOString().split('T')[0],
              description: segment.description || "",
            }));
            
            setSegments(mappedSegments);
            
            // Si es una cotización total (solo un segmento), establecer los valores para el formulario de cotización total
            if (!isSegmentedQuote && mappedSegments.length === 1) {
              setSingleDeliveryDate(mappedSegments[0].estimatedDeliveryDate);
              setSingleDescription(mappedSegments[0].description);
            }
          } else {
            // Si no hay segmentos, inicializar como cotización total con valores vacíos
            setSegments([]);
            setSingleDeliveryDate("");
            setSingleDescription("");
          }
        }
      }
    } catch (error) {
      console.error("Error loading existing quote:", error);
      toast.error("Error al cargar la cotización existente");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setMaterialCost("");
    setDirectCost("");
    setIndirectCost("");
    setAdditionalDetails("");
    setSegments([]);
    setNewSegmentDate("");
    setNewSegmentDescription("");
    setIsSegmented(false);
    setSingleDeliveryDate("");
    setSingleDescription("");
    onOpenChange(false);
  };

  const adjustDateForTimezone = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toISOString().split('T')[0];
  };

  const handleAddSegment = () => {
    if (!newSegmentDate || !newSegmentDescription) {
      toast.error("Por favor complete la fecha y descripción del segmento");
      return;
    }

    setSegments([
      ...segments,
      {
        estimatedDeliveryDate: newSegmentDate,
        description: newSegmentDescription,
      },
    ]);

    // Limpiar campos
    setNewSegmentDate("");
    setNewSegmentDescription("");
  };

  const handleEditSegment = (index: number) => {
    const segmentToEdit = segments[index];
    setNewSegmentDate(segmentToEdit.estimatedDeliveryDate);
    setNewSegmentDescription(segmentToEdit.description);
    setEditingSegmentIndex(index);
  };

  const handleUpdateSegment = () => {
    if (editingSegmentIndex === null || !newSegmentDate || !newSegmentDescription) {
      toast.error("Por favor complete la fecha y descripción del segmento");
      return;
    }

    const updatedSegments = [...segments];
    updatedSegments[editingSegmentIndex] = {
      ...updatedSegments[editingSegmentIndex],
      estimatedDeliveryDate: newSegmentDate,
      description: newSegmentDescription,
    };

    setSegments(updatedSegments);
    setNewSegmentDate("");
    setNewSegmentDescription("");
    setEditingSegmentIndex(null);
    toast.success("Segmento actualizado correctamente");
  };

  const handleCancelEdit = () => {
    setNewSegmentDate("");
    setNewSegmentDescription("");
    setEditingSegmentIndex(null);
  };

  const handleDeleteSegment = (index: number) => {
    setSegmentToDeleteIndex(index);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSegment = () => {
    if (segmentToDeleteIndex !== null) {
      const updatedSegments = [...segments];
      updatedSegments.splice(segmentToDeleteIndex, 1);
      setSegments(updatedSegments);
      setDeleteDialogOpen(false);
      setSegmentToDeleteIndex(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que al menos un segmento esté definido si es segmentado
    if (isSegmented && segments.length === 0) {
      toast.error("Debe agregar al menos un segmento de entrega");
      return;
    }

    // Validar que la fecha y descripción estén definidas si es total
    if (!isSegmented && (!singleDeliveryDate || !singleDescription)) {
      toast.error("La fecha de entrega y descripción son obligatorias");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }

      // Datos básicos de la cotización
      formData.append("materialCost", materialCost);
      formData.append("directCost", directCost);
      formData.append("indirectCost", indirectCost);
      formData.append("projectTypesId", isSegmented ? "2" : "1"); // 1=Total, 2=Segmentada
      formData.append("additionalDetails", additionalDetails);
      
      // Segmentos según el tipo de cotización
      if (isSegmented) {
        // Múltiples segmentos para cotización segmentada
        formData.append("segments", JSON.stringify(segments));
      } else {
        // Un solo segmento para cotización total
        formData.append(
          "segments",
          JSON.stringify([
            {
              estimatedDeliveryDate: singleDeliveryDate,
              description: singleDescription,
            },
          ])
        );
      }

      const response = await fetch(
        `/api/assigned_companies/${item.id}/upload-quote`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al subir la cotización");
      }

      toast.success(
        existingQuotation
          ? "Cotización actualizada correctamente"
          : "Cotización subida correctamente"
      );
      handleReset();
      onSuccess();
    } catch (error: any) {
      console.error("Error uploading quote:", error);
      toast.error(error.message || "Error al subir la cotización");
    } finally {
      setUploading(false);
    }
  };

  // Función para calcular el total de costos
  const calculateTotalCost = (): number => {
    const material = parseFloat(materialCost) || 0;
    const direct = parseFloat(directCost) || 0;
    const indirect = parseFloat(indirectCost) || 0;
    return material + direct + indirect;
  };

  // Formatear número como moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleReset}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle>
              {existingQuotation ? "Editar Cotización" : "Subir Cotización"}
            </DialogTitle>
            <DialogDescription>
              {item.Company?.comercialName || item.Company?.name || "N/A"}
            </DialogDescription>
            
            {/* Información de solicitud y requerimientos */}
            <div className="grid grid-cols-2 gap-4 mt-4 mb-2">
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Solicitud</h3>
                <div className="text-sm">{item.ProjectRequest?.title || item.ProjectRequest?.name || "N/A"}</div>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Requerimientos</h3>
                <div className="text-sm">{item.requirements && item.requirements.length > 0
                  ? `${item.requirements.map((req) => req.name).join(", ")}`
                  : "Sin requerimientos"}</div>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2 mb-6">
                <Label htmlFor="file">Archivo de Cotización</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files![0])}
                  disabled={uploading}
                  className="cursor-pointer"
                />
                {existingFileName && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Archivo existente: {existingFileName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="materialCost">Costo de Materiales</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="materialCost"
                      type="number"
                      placeholder="0.00"
                      value={materialCost}
                      onChange={(e) => setMaterialCost(e.target.value)}
                      disabled={uploading}
                      className="pl-7"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="directCost">Costo Directo</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="directCost"
                      type="number"
                      placeholder="0.00"
                      value={directCost}
                      onChange={(e) => setDirectCost(e.target.value)}
                      disabled={uploading}
                      className="pl-7"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="indirectCost">Costo Indirecto</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="indirectCost"
                      type="number"
                      placeholder="0.00"
                      value={indirectCost}
                      onChange={(e) => setIndirectCost(e.target.value)}
                      disabled={uploading}
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>
                
              {/* Cálculo de costos totales */}
              <div className="w-full text-right border-t pt-2">
                <p className="font-medium text-lg">
                  Costos totales: {formatCurrency(calculateTotalCost())} MXN
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="isSegmented"
                  checked={isSegmented}
                  onCheckedChange={setIsSegmented}
                  disabled={uploading}
                />
                <Label htmlFor="isSegmented">
                  Cotización Segmentada
                </Label>
              </div>

              {!isSegmented ? (
                // Cotización Total (una sola fecha y descripción)
                <div className="mt-4 border rounded-lg p-4 bg-slate-50">
                  <h3 className="text-lg font-medium mb-4">Entrega Total</h3>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="singleDeliveryDate">Fecha Estimada de Entrega</Label>
                      <Input
                        id="singleDeliveryDate"
                        type="date"
                        value={singleDeliveryDate}
                        onChange={(e) => setSingleDeliveryDate(e.target.value)}
                        disabled={uploading}
                      />
                    </div>

                    <div>
                      <Label htmlFor="singleDescription">Descripción</Label>
                      <Textarea
                        id="singleDescription"
                        value={singleDescription}
                        onChange={(e) => setSingleDescription(e.target.value)}
                        disabled={uploading}
                        placeholder="Descripción de la entrega"
                        rows={3}
                        className="min-h-[80px] w-full"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Cotización Segmentada (múltiples fechas y descripciones)
                <div className="mt-4 border rounded-lg p-4 bg-slate-50">
                  <h3 className="text-lg font-medium mb-4">Segmentos de Entrega</h3>

                  {/* Formulario para agregar nuevo segmento */}
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="newSegmentDate">Fecha Estimada de Entrega</Label>
                        <Input
                          id="newSegmentDate"
                          type="date"
                          value={newSegmentDate}
                          onChange={(e) => setNewSegmentDate(e.target.value)}
                          disabled={uploading}
                        />
                      </div>
                      <div className="flex items-end">
                        {editingSegmentIndex !== null ? (
                          <div className="flex gap-2 ml-auto">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={uploading}
                              className="h-10"
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={handleUpdateSegment}
                              disabled={uploading || !newSegmentDate || !newSegmentDescription}
                              className="h-10"
                            >
                              Actualizar Segmento
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddSegment}
                            disabled={uploading || !newSegmentDate || !newSegmentDescription}
                            className="h-10 ml-auto"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Segmento
                          </Button>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="newSegmentDescription">Descripción</Label>
                      <Textarea
                        id="newSegmentDescription"
                        value={newSegmentDescription}
                        onChange={(e) => setNewSegmentDescription(e.target.value)}
                        disabled={uploading}
                        placeholder="Descripción del segmento"
                        rows={3}
                        className="min-h-[80px] w-full"
                      />
                    </div>
                  </div>

                  {/* Tabla de segmentos existentes */}
                  {segments.length > 0 && (
                    <div>
                      <ScrollArea className={`${segments.length <= 3 ? 'h-auto' : 'h-[300px]'}`}>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha Estimada de Entrega</TableHead>
                              <TableHead>Descripción</TableHead>
                              <TableHead className="w-[100px]">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {segments.map((segment, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {new Date(segment.estimatedDeliveryDate).toLocaleDateString('es-MX', {
                                    timeZone: 'UTC' // Esto evita el ajuste de zona horaria
                                  })}
                                </TableCell>
                                <TableCell>{segment.description}</TableCell>
                                <TableCell>
                                  <div className="flex space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditSegment(index)}
                                      disabled={uploading || editingSegmentIndex !== null}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                      </svg>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteSegment(index)}
                                      disabled={uploading}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4">
                <Label htmlFor="additionalDetails" className="text-right">
                  Observaciones Adicionales
                </Label>
                <Textarea
                  id="additionalDetails"
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  disabled={uploading}
                  placeholder="Detalles adicionales sobre la cotización"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleReset}>
                Cancelar
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    {existingQuotation ? "Guardar cambios" : "Subir Cotización"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar segmento */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar segmento</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea eliminar este segmento de entrega?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSegment}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
