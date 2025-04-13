"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea"; // Agregar la importación de Textarea
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface ClientQuotationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectRequestId: number;
  onSuccess?: () => void;
}

interface CompanyQuotation {
  id: number;
  companyId: number;
  companyName: string;
  materialCost: number | null;
  directCost: number | null;
  indirectCost: number | null;
  price: number | null;
  isClientSelected: boolean;
  statusId: number;
}

export function ClientQuotationModal({
  open,
  onOpenChange,
  projectRequestId,
  onSuccess,
}: ClientQuotationModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState<CompanyQuotation[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [clientPrice, setClientPrice] = useState("");
  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [observations, setObservations] = useState("");
  const [existingQuotation, setExistingQuotation] = useState(false);

  // Calcular los totales
  const totalMaterialCost = companies
    .filter((company) => company.isClientSelected)
    .reduce((sum, company) => sum + (company.materialCost || 0), 0);

  const totalDirectCost = companies
    .filter((company) => company.isClientSelected)
    .reduce((sum, company) => sum + (company.directCost || 0), 0);

  const totalIndirectCost = companies
    .filter((company) => company.isClientSelected)
    .reduce((sum, company) => sum + (company.indirectCost || 0), 0);

  const totalPrice = companies
    .filter((company) => company.isClientSelected)
    .reduce((sum, company) => sum + (company.price || 0), 0);

  const totalCost = totalMaterialCost + totalDirectCost + totalIndirectCost;

  // Función para formatear un número a 2 decimales
  const formatToTwoDecimals = (
    value: string | number | null | undefined
  ): string => {
    if (value === null || value === undefined || value === "") return "";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "";
    return numValue.toFixed(2);
  };

  // Formatear número como moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (open) {
      loadData(true);
    } else {
      // Limpiar estados cuando se cierra el modal
      resetForm();
    }
  }, [open, projectRequestId]);

  // Actualizar el precio al cliente cuando cambia el costo total
  useEffect(() => {
    // Solo actualizar el precio automáticamente si está vacío, es 0, o no es una cotización existente
    if (!existingQuotation || clientPrice === "" || clientPrice === "0" || parseFloat(clientPrice) === 0) {
      setClientPrice(formatToTwoDecimals(totalCost));
    }
  }, [totalCost, existingQuotation]);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      // Cargar las cotizaciones de empresas con status "Revisión Ok"
      const companiesResponse = await fetch(
        `/api/project_requests/${projectRequestId}/quotations/approved`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!companiesResponse.ok) {
        throw new Error("Error al cargar las cotizaciones aprobadas");
      }

      const companiesData = await companiesResponse.json();
      // La respuesta ahora es un array directamente, no un objeto con una propiedad quotations
      setCompanies(companiesData || []);

      // Cargar la cotización para cliente existente (si hay)
      const clientQuotationResponse = await fetch(
        `/api/project_requests/${projectRequestId}/client-quotation`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (clientQuotationResponse.ok) {
        const clientQuotationData = await clientQuotationResponse.json();

        if (clientQuotationData.quotation) {
          setExistingQuotation(true);
          setExistingFileName(
            clientQuotationData.quotation.quotationFileName || null
          );
          setClientPrice(
            clientQuotationData.quotation.clientPrice
              ? formatToTwoDecimals(clientQuotationData.quotation.clientPrice)
              : ""
          );
          setQuotationDate(
            new Date(clientQuotationData.quotation.dateQuotationClient)
              .toISOString()
              .split("T")[0]
          );
          setObservations(clientQuotationData.quotation.observations || "");

          // Marcar las empresas seleccionadas
          if (
            clientQuotationData.selectedCompanies &&
            clientQuotationData.selectedCompanies.length > 0
          ) {
            const selectedIds = clientQuotationData.selectedCompanies.map(
              (c: any) => c.id
            );
            setCompanies((prevCompanies) =>
              prevCompanies.map((company) => ({
                ...company,
                isClientSelected: selectedIds.includes(company.id),
              }))
            );
          }
        }
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar los datos de cotizaciones");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleCompanySelection = (companyId: number, checked: boolean) => {
    setCompanies((prevCompanies) =>
      prevCompanies.map((company) =>
        company.id === companyId
          ? { ...company, isClientSelected: checked }
          : company
      )
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que al menos una empresa esté seleccionada
    if (!companies.some((company) => company.isClientSelected)) {
      toast.error("Debe seleccionar al menos una empresa");
      return;
    }

    // Validar que se haya ingresado un precio para el cliente
    if (!clientPrice || parseFloat(clientPrice) <= 0) {
      toast.error("Debe ingresar un precio válido para el cliente");
      return;
    }

    // Validar que se haya seleccionado una fecha
    if (!quotationDate) {
      toast.error("Debe seleccionar una fecha para la cotización");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      // Agregar el archivo si se seleccionó uno nuevo
      if (file) {
        formData.append("file", file);
      }

      // Formatear el precio a 2 decimales antes de enviarlo
      const formattedPrice = formatToTwoDecimals(clientPrice) || "0.00";
      formData.append("clientPrice", formattedPrice);
      formData.append("dateQuotationClient", quotationDate);
      formData.append("observations", observations);

      // IDs de las empresas seleccionadas
      const selectedCompanyIds = companies
        .filter((company) => company.isClientSelected)
        .map((company) => company.id);

      formData.append("selectedCompanyIds", JSON.stringify(selectedCompanyIds));

      const response = await fetch(
        `/api/project_requests/${projectRequestId}/client-quotation`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error al guardar la cotización para cliente"
        );
      }

      toast.success(
        existingQuotation
          ? "Cotización para cliente actualizada correctamente"
          : "Cotización para cliente creada correctamente"
      );

      // Limpiar el formulario y cerrar el modal
      onOpenChange(false);

      // Llamar al callback de éxito si existe
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error al guardar la cotización para cliente:", error);
      toast.error(
        error.message || "Error al guardar la cotización para cliente"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setExistingFileName(null);
    setClientPrice("");
    setQuotationDate(new Date().toISOString().split("T")[0]);
    setObservations("");
    setExistingQuotation(false);
    setCompanies([]);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingQuotation
              ? "Editar Cotización para Cliente"
              : "Nueva Cotización para Cliente"}
          </DialogTitle>
          <DialogDescription>
            Seleccione las cotizaciones de proveedores que desea incluir en la
            cotización para el cliente
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Cargando cotizaciones...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {companies.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Seleccionar</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead className="text-center">
                          Costo Material
                        </TableHead>
                        <TableHead className="text-center">
                          Costo Directo
                        </TableHead>
                        <TableHead className="text-center">
                          Costo Indirecto
                        </TableHead>
                        <TableHead className="text-center">Precio</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((company) => {
                        const companyTotal =
                          (company.materialCost || 0) +
                          (company.directCost || 0) +
                          (company.indirectCost || 0);

                        return (
                          <TableRow key={company.id}>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={company.isClientSelected}
                                  onCheckedChange={(checked) =>
                                    handleCompanySelection(
                                      company.id,
                                      checked === true
                                    )
                                  }
                                  disabled={submitting}
                                />
                              </div>
                            </TableCell>
                            <TableCell>{company.companyName}</TableCell>
                            <TableCell className="text-center">
                              {company.materialCost
                                ? formatCurrency(company.materialCost)
                                : "$0.00"}
                            </TableCell>
                            <TableCell className="text-center">
                              {company.directCost
                                ? formatCurrency(company.directCost)
                                : "$0.00"}
                            </TableCell>
                            <TableCell className="text-center">
                              {company.indirectCost
                                ? formatCurrency(company.indirectCost)
                                : "$0.00"}
                            </TableCell>
                            <TableCell className="text-center">
                              {company.price
                                ? formatCurrency(company.price)
                                : "$0.00"}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {formatCurrency(companyTotal)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No hay cotizaciones aprobadas disponibles
                </div>
              )}

              {/* Resumen de costos totales */}
              <div className="bg-muted/30 p-4 rounded-lg border mb-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label className="text-sm text-center font-medium">
                      Costo Total Material
                    </Label>
                    <div className="text-left font-medium mt-1">
                      {formatCurrency(totalMaterialCost)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-center font-medium">
                      Costo Total Directo
                    </Label>
                    <div className="text-left font-medium mt-1">
                      {formatCurrency(totalDirectCost)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-center font-medium">
                      Costo Total Indirecto
                    </Label>
                    <div className="text-left font-medium mt-1">
                      {formatCurrency(totalIndirectCost)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-center font-medium">
                      Precio Total
                    </Label>
                    <div className="text-left font-medium mt-1">
                      {formatCurrency(totalPrice)}
                    </div>
                  </div>
                  <div />
                  <div>
                    <Label className="text-sm text-center font-medium">
                      Costo Total
                    </Label>
                    <div className="text-left font-medium mt-1">
                      {formatCurrency(totalCost)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <Label className="text-base font-semibold mr-4">
                      Precio al Cliente:
                    </Label>
                    <div className="relative w-56">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <Input
                        id="clientPrice"
                        type="number"
                        className="pl-7 text-lg"
                        placeholder="0.00"
                        value={clientPrice}
                        onChange={(e) => {
                          // Usar la función de formateo para asegurar 2 decimales
                          const value = e.target.value;
                          if (value === "" || value === "0") {
                            setClientPrice(value);
                          } else {
                            setClientPrice(formatToTwoDecimals(value));
                          }
                        }}
                        step="0.01"
                        min="0"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Datos de la cotización para cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="file">
                    Archivo de Cotización para Cliente
                  </Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    disabled={submitting}
                  />
                  {existingFileName && (
                    <p className="text-sm text-muted-foreground">
                      Archivo actual: {existingFileName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quotationDate">Fecha de Cotización</Label>
                  <Input
                    id="quotationDate"
                    type="date"
                    value={quotationDate}
                    onChange={(e) => setQuotationDate(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-2 mt-2">
                <Label htmlFor="observations">Observaciones</Label>
                <Textarea
                  id="observations"
                  placeholder="Ingrese observaciones adicionales aquí"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={submitting}
              >
                Cerrar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : existingQuotation ? (
                  "Actualizar Cotización"
                ) : (
                  "Guardar Cotización"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
