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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Loader2, Check, X, AlertCircle } from "lucide-react";

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
  isClientApproved: boolean;
  isClientSelected: boolean; // Volvemos a agregar esta propiedad
  statusId: number;
  requirementId: number;
  requirementName: string;
}

interface RequirementWithQuotations {
  id: number;
  requirementName: string;
  quotations: CompanyQuotation[];
}

interface ApprovalState {
  [quotationId: number]: {
    isApproved: boolean;
    rejectionReason: string;
  };
}

interface ApprovalItem {
  quotationId: number;
}

interface RejectionItem {
  quotationId: number;
  rejectionReason: string;
}

export function ClientQuotationModal({
  open,
  onOpenChange,
  projectRequestId,
  onSuccess,
}: ClientQuotationModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requirementsWithQuotations, setRequirementsWithQuotations] = useState<
    RequirementWithQuotations[]
  >([]);
  const [file, setFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [clientPrice, setClientPrice] = useState("");
  const [observations, setObservations] = useState("");
  const [existingQuotation, setExistingQuotation] = useState(false);
  const [approvalState, setApprovalState] = useState<ApprovalState>({});
  const [clientName, setClientName] = useState<string>("");

  // Calcular los totales por requerimiento
  const requirementTotals = requirementsWithQuotations.map((req) => {
    // Solo incluir en los totales las cotizaciones seleccionadas (aprobadas)
    const selectedQuotations = req.quotations.filter(
      (company) =>
        approvalState[company.id]?.isApproved === true
    );

    const materialCost = selectedQuotations.reduce(
      (sum, company) => sum + (company.materialCost ?? 0),
      0
    );
    const directCost = selectedQuotations.reduce(
      (sum, company) => sum + (company.directCost ?? 0),
      0
    );
    const indirectCost = selectedQuotations.reduce(
      (sum, company) => sum + (company.indirectCost ?? 0),
      0
    );
    const price = selectedQuotations.reduce(
      (sum, company) => sum + (company.price ?? 0),
      0
    );

    return {
      requirementId: req.id,
      requirementName: req.requirementName,
      materialCost,
      directCost,
      indirectCost,
      price,
      totalCost: materialCost + directCost + indirectCost,
    };
  });

  // Calcular los totales generales
  const allSelectedQuotations = requirementsWithQuotations.flatMap((req) =>
    req.quotations.filter(
      (company) =>
        approvalState[company.id]?.isApproved === true
    )
  );

  const totalMaterialCost = allSelectedQuotations.reduce(
    (sum, company) => sum + (company.materialCost ?? 0),
    0
  );

  const totalDirectCost = allSelectedQuotations.reduce(
    (sum, company) => sum + (company.directCost ?? 0),
    0
  );

  const totalIndirectCost = allSelectedQuotations.reduce(
    (sum, company) => sum + (company.indirectCost ?? 0),
    0
  );

  const totalPrice = allSelectedQuotations.reduce(
    (sum, company) => sum + (company.price ?? 0),
    0
  );

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

  // Función para formatear como moneda en tiempo real
  const formatAsCurrency = (value: string): string => {
    if (!value) return "";
    
    // Eliminar cualquier caracter que no sea número o punto
    let numericValue = value.replace(/[^\d.]/g, "");
    
    // Manejar el punto decimal
    const hasDecimal = numericValue.includes(".");
    let integerPart = hasDecimal ? numericValue.split(".")[0] : numericValue;
    let decimalPart = hasDecimal ? numericValue.split(".")[1] : "";
    
    // Limitar decimales a 2
    if (decimalPart.length > 2) {
      decimalPart = decimalPart.substring(0, 2);
    }
    
    // Formatear la parte entera con comas para miles
    if (integerPart.length > 3) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    // Reconstruir el valor
    return hasDecimal ? `${integerPart}.${decimalPart}` : integerPart;
  };

  // Función para formatear número como moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Función para formatear número con comas
  const formatNumberWithCommas = (value: string | number): string => {
    // Convertir a número y luego a string con formato
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return "0.00";
    
    // Formatear con comas para miles y dos decimales
    return new Intl.NumberFormat("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
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

  // Inicializar el estado de aprobación cuando se cargan las cotizaciones
  useEffect(() => {
    if (requirementsWithQuotations.length > 0) {
      const initialState: ApprovalState = {};
      
      requirementsWithQuotations.forEach(req => {
        req.quotations.forEach(company => {
          // Si es una cotización existente, usamos el estado actual
          // Si es nueva, todas empiezan como no aprobadas
          initialState[company.id] = {
            isApproved: company.isClientApproved,
            rejectionReason: ""
          };
        });
      });
      
      console.log("Estado inicial de aprobación:", initialState);
      setApprovalState(initialState);
    }
  }, [requirementsWithQuotations]);

  // Actualizar el precio al cliente cuando cambia el costo total o si ya existe una cotización
  useEffect(() => {
    if (
      !existingQuotation ||
      clientPrice === "" ||
      clientPrice === "0" ||
      clientPrice === "0.00" ||
      parseFloat(clientPrice.replace(/,/g, "")) === 0
    ) {
      // Convertir a entero
      const priceAsInt = Math.floor(totalPrice);
      const formattedPrice = formatNumberWithCommas(priceAsInt);
      setClientPrice(formattedPrice);
    }
  }, [totalPrice, existingQuotation]);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      // Cargar información del proyecto para obtener el nombre del cliente
      const projectResponse = await fetch(
        `/api/project_requests/${projectRequestId}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        if (projectData.client && projectData.client.name) {
          setClientName(projectData.client.name);
        } else if (projectData.clientName) {
          setClientName(projectData.clientName);
        }
      }

      // Cargar las cotizaciones de empresas seleccionadas
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
      console.log("Datos de cotizaciones cargados:", companiesData);

      // Filtrar requerimientos que tienen al menos una cotización
      const requirementsWithData = companiesData.filter(
        (req: RequirementWithQuotations) =>
          req.quotations && req.quotations.length > 0
      );
      console.log("Requerimientos con cotizaciones:", requirementsWithData);

      setRequirementsWithQuotations(requirementsWithData || []);

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
        console.log("Datos de cotización para cliente:", clientQuotationData);

        if (clientQuotationData.quotation) {
          setExistingQuotation(true);
          setExistingFileName(
            clientQuotationData.quotation.quotationFileName || null
          );
          setClientPrice(
            clientQuotationData.quotation.clientPrice
              ? formatToTwoDecimals(clientQuotationData.quotation.clientPrice.toString())
              : ""
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
            console.log("IDs de empresas seleccionadas:", selectedIds);

            // Actualizar correctamente el estado de requirementsWithQuotations
            setRequirementsWithQuotations((prevRequirements) =>
              prevRequirements.map((req) => ({
                ...req,
                quotations: req.quotations.map((company) => ({
                  ...company,
                  isClientSelected: selectedIds.includes(company.id),
                })),
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Nueva función para manejar la aprobación/rechazo de cotizaciones
  const handleApprovalChange = (quotationId: number, isApproved: boolean) => {
    console.log("Cambiando aprobación:", quotationId, isApproved);
    
    // Actualizar el estado directamente
    setApprovalState((prev) => {
      const newState = {
        ...prev,
        [quotationId]: {
          isApproved,
          rejectionReason: prev[quotationId]?.rejectionReason || "",
        },
      };
      
      console.log("Nuevo estado:", newState);
      return newState;
    });
  };

  // Nueva función para manejar el motivo de rechazo
  const handleRejectionReasonChange = (quotationId: number, reason: string) => {
    setApprovalState((prev) => ({
      ...prev,
      [quotationId]: {
        ...prev[quotationId],
        rejectionReason: reason,
      },
    }));
  };

  // Función para guardar las aprobaciones/rechazos de cotizaciones
  const saveApprovals = async () => {
    // Verificar que todas las cotizaciones tengan una decisión
    const pendingDecisions = requirementsWithQuotations.flatMap((req) =>
      req.quotations.filter(
        (company) =>
          !company.isClientApproved &&
          approvalState[company.id] === undefined
      )
    );

    if (pendingDecisions.length > 0) {
      toast.error(
        "Debe aprobar o rechazar todas las cotizaciones antes de continuar"
      );
      return false;
    }

    // Verificar que todas las cotizaciones rechazadas tengan un motivo
    const rejectedWithoutReason = requirementsWithQuotations.flatMap((req) =>
      req.quotations.filter(
        (company) =>
          approvalState[company.id]?.isApproved === false &&
          (!approvalState[company.id]?.rejectionReason ||
            approvalState[company.id]?.rejectionReason.trim() === "")
      )
    );

    if (rejectedWithoutReason.length > 0) {
      toast.error(
        "Debe ingresar un motivo para todas las cotizaciones rechazadas"
      );
      return false;
    }

    try {
      // Preparar los datos para enviar
      const approvals: ApprovalItem[] = [];
      const rejections: RejectionItem[] = [];

      requirementsWithQuotations.forEach((req) => {
        req.quotations.forEach((company) => {
          // Solo procesar las cotizaciones que han cambiado su estado
          const currentApprovalState = approvalState[company.id]?.isApproved;
          
          // Si el estado actual es diferente al estado guardado
          if (currentApprovalState !== company.isClientApproved) {
            if (currentApprovalState === true && !company.isClientApproved) {
              approvals.push({
                quotationId: company.id,
              });
            } else if (currentApprovalState === false && company.isClientApproved) {
              rejections.push({
                quotationId: company.id,
                rejectionReason: approvalState[company.id]?.rejectionReason || "",
              });
            }
          }
        });
      });

      // Solo enviar si hay cambios
      if (approvals.length > 0 || rejections.length > 0) {
        console.log("Aprobaciones a enviar:", approvals);
        console.log("Rechazos a enviar:", rejections);
        
        let hasError = false;
        let errorMessage = "";

        // Procesar cada aprobación
        for (const approval of approvals) {
          try {
            const response = await fetch(
              `/api/project_requests/${projectRequestId}/client-quotation-approval`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                  quotationId: approval.quotationId,
                }),
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              console.warn(`Error al aprobar cotización ${approval.quotationId}:`, errorData.error);
              // Continuamos con las demás operaciones
            }
          } catch (error) {
            console.error(`Error al aprobar cotización ${approval.quotationId}:`, error);
            // Continuamos con las demás operaciones
          }
        }

        // Procesar cada rechazo
        for (const rejection of rejections) {
          try {
            const response = await fetch(
              `/api/project_requests/${projectRequestId}/client-quotation-rejection`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                  quotationId: rejection.quotationId,
                  rejectionReason: rejection.rejectionReason,
                }),
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              console.warn(`Error al rechazar cotización ${rejection.quotationId}:`, errorData.error);
              // Continuamos con las demás operaciones
            }
          } catch (error) {
            console.error(`Error al rechazar cotización ${rejection.quotationId}:`, error);
            // Continuamos con las demás operaciones
          }
        }

        // Actualizar el estado local para reflejar los cambios
        setRequirementsWithQuotations((prevRequirements) => {
          return prevRequirements.map((req) => ({
            ...req,
            quotations: req.quotations.map((company) => {
              // Actualizar según el estado actual en approvalState
              const newApprovalState = approvalState[company.id]?.isApproved;
              if (newApprovalState !== undefined) {
                return { ...company, isClientApproved: newApprovalState };
              }
              return company;
            }),
          }));
        });

        // Recargar los datos para asegurar que tenemos la información más actualizada
        await loadData(false);
      }

      return true;
    } catch (error: any) {
      console.error(
        "Error al guardar las aprobaciones/rechazos de cotizaciones:",
        error
      );
      toast.error(
        error.message ||
          "Error al guardar las aprobaciones/rechazos de cotizaciones"
      );
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que haya cotizaciones seleccionadas
    const hasSelectedQuotations = requirementsWithQuotations.some((req) =>
      req.quotations.some(
        (company) =>
          approvalState[company.id]?.isApproved === true ||
          company.isClientApproved
      )
    );

    if (!hasSelectedQuotations) {
      toast.error("Debe seleccionar al menos una cotización");
      return;
    }

    // Validar que se haya ingresado un precio para el cliente
    if (!clientPrice || parseFloat(clientPrice.replace(/,/g, "")) <= 0) {
      toast.error("Debe ingresar un precio válido para el cliente");
      return;
    }

    // Validar que se haya seleccionado un archivo si es una nueva cotización
    if (!existingQuotation && !file) {
      toast.error("Debe seleccionar un archivo de cotización");
      return;
    }

    // Primero guardar las aprobaciones/rechazos
    const approvalsSuccess = await saveApprovals();
    if (!approvalsSuccess) {
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      // Agregar el archivo si se seleccionó uno nuevo
      if (file) {
        formData.append("file", file);
      }

      // Formatear el precio a 2 decimales antes de enviarlo (quitar comas)
      const priceAsNumber = parseFloat(clientPrice.replace(/,/g, "")) || 0;
      const formattedPrice = priceAsNumber.toFixed(2);
      formData.append("clientPrice", formattedPrice);

      // Usar la fecha actual
      const currentDate = new Date().toISOString().split("T")[0];
      formData.append("dateQuotationClient", currentDate);

      formData.append("observations", observations);

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
    setObservations("");
    setExistingQuotation(false);
    setRequirementsWithQuotations([]);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {clientName
              ? `Cotización para ${clientName}`
              : "Cotización para Cliente"}
          </DialogTitle>
          <DialogDescription>
            Seleccione las cotizaciones que desea incluir en la cotización para
            el cliente.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Cargando cotizaciones...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Requerimientos y cotizaciones */}
              {requirementsWithQuotations.length > 0 ? (
                <div className="space-y-6">
                  {requirementsWithQuotations.map((req) => (
                    <div
                      key={req.id}
                      className="border rounded-lg overflow-hidden bg-background shadow-sm"
                    >
                      <div className="bg-muted/40 px-4 py-3 border-b">
                        <h3 className="text-lg font-semibold">
                          {req.requirementName}
                        </h3>
                      </div>

                      {req.quotations.length > 0 ? (
                        <div className="p-4 space-y-4">
                          {req.quotations.map((company) => {
                            const companyTotal =
                              (company.materialCost ?? 0) +
                              (company.directCost ?? 0) +
                              (company.indirectCost ?? 0);

                            return (
                              <div
                                key={company.id}
                                className="border rounded-md p-4"
                              >
                                <div className="flex flex-col space-y-4">
                                  {/* Encabezado con nombre del asociado */}
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`approve-${company.id}`}
                                        checked={
                                          approvalState[company.id]?.isApproved === true
                                        }
                                        onCheckedChange={(checked) => {
                                          console.log("Checkbox clicked:", company.id, checked);
                                          handleApprovalChange(
                                            company.id,
                                            checked === true
                                          );
                                        }}
                                      />
                                      <Label
                                        htmlFor={`approve-${company.id}`}
                                        className="font-medium text-base"
                                      >
                                        {company.companyName}
                                      </Label>
                                    </div>
                                  </div>

                                  {/* Costos y precio */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/20 p-3 rounded-md">
                                    <div>
                                      <span className="text-xs text-muted-foreground block">
                                        Costo Material
                                      </span>
                                      <span className="font-medium">
                                        {company.materialCost
                                          ? formatCurrency(company.materialCost)
                                          : "$0.00"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-xs text-muted-foreground block">
                                        Costo Directo
                                      </span>
                                      <span className="font-medium">
                                        {company.directCost
                                          ? formatCurrency(company.directCost)
                                          : "$0.00"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-xs text-muted-foreground block">
                                        Costo Indirecto
                                      </span>
                                      <span className="font-medium">
                                        {company.indirectCost
                                          ? formatCurrency(company.indirectCost)
                                          : "$0.00"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-xs text-muted-foreground block">
                                        Precio
                                      </span>
                                      <span className="font-medium">
                                        {company.price
                                          ? formatCurrency(company.price)
                                          : "$0.00"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Motivo de rechazo */}
                                  <div className="flex-1">
                                    <Input
                                      type="text"
                                      placeholder="Motivo por el que no se selecciona la cotización"
                                      value={
                                        approvalState[company.id]
                                          ?.rejectionReason || ""
                                      }
                                      onChange={(e) =>
                                        handleRejectionReasonChange(
                                          company.id,
                                          e.target.value
                                        )
                                      }
                                      disabled={
                                        submitting ||
                                        approvalState[company.id]?.isApproved === true
                                      }
                                      className="text-sm h-8 w-full"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Subtotales por requerimiento */}
                          {req.quotations.some((q) => 
                            approvalState[q.id]?.isApproved === true
                          ) && (
                            <div className="bg-muted/30 p-3 rounded-md mt-3">
                              <div className="text-sm font-medium mb-2">
                                Subtotal: {req.requirementName}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    Costo Material
                                  </div>
                                  <div className="font-medium">
                                    {formatCurrency(
                                      requirementTotals.find(
                                        (r) => r.requirementId === req.id
                                      )?.materialCost ?? 0
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    Costo Directo
                                  </div>
                                  <div className="font-medium">
                                    {formatCurrency(
                                      requirementTotals.find(
                                        (r) => r.requirementId === req.id
                                      )?.directCost ?? 0
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    Costo Indirecto
                                  </div>
                                  <div className="font-medium">
                                    {formatCurrency(
                                      requirementTotals.find(
                                        (r) => r.requirementId === req.id
                                      )?.indirectCost ?? 0
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    Precio
                                  </div>
                                  <div className="font-medium">
                                    {formatCurrency(
                                      requirementTotals.find(
                                        (r) => r.requirementId === req.id
                                      )?.price ?? 0
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          No hay cotizaciones disponibles para este
                          requerimiento
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-10 w-10 mx-auto mb-2" />
                  <p>No hay cotizaciones disponibles para esta solicitud</p>
                </div>
              )}

              {/* Totales generales - Siempre visible incluso con valores en cero */}
              <div className="bg-muted/40 p-4 rounded-lg border mt-6">
                <h3 className="text-lg font-semibold mb-3">
                  Totales Generales
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Costo Material</h4>
                    <p className="text-lg font-semibold">
                      {formatCurrency(totalMaterialCost)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Costo Directo</h4>
                    <p className="text-lg font-semibold">
                      {formatCurrency(totalDirectCost)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">
                      Costo Indirecto
                    </h4>
                    <p className="text-lg font-semibold">
                      {formatCurrency(totalIndirectCost)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Precio Total</h4>
                    <p className="text-lg font-semibold text-primary">
                      {formatCurrency(totalPrice)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-end items-center gap-2 pr-10">
                    <span className="font-medium text-base">Costo Total:</span>
                    <span className="text-lg font-semibold">
                      {formatCurrency(totalCost)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col md:flex-row md:items-end gap-4">
                    <div>
                      <Label className="text-base font-semibold mb-1">
                        Precio al Cliente:
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <Input
                          id="clientPrice"
                          type="text"
                          className="pl-7 text-lg w-100"
                          placeholder="0"
                          value={clientPrice}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, "");
                            setClientPrice(value);
                          }}
                          onBlur={() => {
                            // Formatear a 2 decimales cuando pierde el foco
                            if (clientPrice) {
                              const priceAsNumber = parseFloat(clientPrice) || 0;
                              // Formatear con comas y dos decimales
                              const formattedPrice = formatNumberWithCommas(priceAsNumber);
                              setClientPrice(formattedPrice);
                            } else {
                              setClientPrice("0.00");
                            }
                          }}
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    <div className="flex-1">
                      <Label htmlFor="file" className="mb-1">
                        Archivo de Cotización
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
                  </div>

                  <div>
                    <Label htmlFor="observations" className="mb-1">
                      Observaciones
                    </Label>
                    <Textarea
                      id="observations"
                      placeholder="Ingrese observaciones adicionales aquí"
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      disabled={submitting}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={submitting}
                >
                  Cancelar
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
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
