"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Loader2, Check, X, AlertCircle, FileIcon } from "lucide-react";

interface ClientQuotationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectRequestId: number;
  onSuccess?: () => void;
}

interface QuotationSegment {
  id: number;
  estimatedDeliveryDate: string;
  description: string;
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
  isClientApproved: boolean;
  nonApprovalReason: string | null;
  statusId: number;
  requirementId: number;
  requirementName: string;
  additionalDetails: string | null;
  segments: QuotationSegment[];
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
  const [totals, setTotals] = useState<{
    materialCost: number;
    directCost: number;
    indirectCost: number;
    price: number;
    clientPrice: number | null;
  }>({
    materialCost: 0,
    directCost: 0,
    indirectCost: 0,
    price: 0,
    clientPrice: null,
  });
  

  const [clientName, setClientName] = useState<string>("");

  // Función para formatear número como moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Función para limpiar el formato de precio y convertirlo a número
  const cleanPriceFormat = (price: string): number => {
    // Eliminar cualquier caracter que no sea número o punto decimal
    const cleanedPrice = price.replace(/[^0-9.]/g, "");
    return Number(cleanedPrice) || 0;
  };

  // Calcular los totales por requerimiento
  const requirementTotals = requirementsWithQuotations.map((req) => {
    // Solo incluir en los totales las cotizaciones seleccionadas (aprobadas)
    const selectedQuotations = req.quotations.filter(
      (company) => approvalState[company.id]?.isApproved === true
    );

    // Sumar los valores directamente sin manipulación
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
      (company) => approvalState[company.id]?.isApproved === true
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

  // Actualizar el estado de totales con los valores calculados
  useEffect(() => {
    setTotals({
      materialCost: totalMaterialCost,
      directCost: totalDirectCost,
      indirectCost: totalIndirectCost,
      price: totalPrice,
      clientPrice: totals.clientPrice
    });
  }, [totalMaterialCost, totalDirectCost, totalIndirectCost, totalPrice]);

  const totalCost = totalMaterialCost + totalDirectCost + totalIndirectCost;

  // Actualizar automáticamente el precio al cliente cuando cambian las selecciones
  useEffect(() => {
    // Actualizar el precio al cliente siempre que cambie la selección de cotizaciones
    const formattedPrice = formatCurrency(totalPrice);
    console.log("Actualizando precio al cliente a:", formattedPrice);
    setClientPrice(formattedPrice);
  }, [totalPrice]);

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (open) {
      loadData(true);
    } else {
      // Limpiar estados cuando se cierra el modal
      resetForm();
    }
  }, [open]);

  // Inicializar el estado de aprobación cuando se cargan los datos
  useEffect(() => {
    if (requirementsWithQuotations.length > 0) {
      console.log("Inicializando estado de aprobación con datos existentes");

      // Crear un nuevo objeto de estado de aprobación
      const newApprovalState: ApprovalState = {};

      // Inicializar el estado para cada cotización
      requirementsWithQuotations.forEach((req) => {
        req.quotations.forEach((company) => {
          // Guardar el estado actual de aprobación y el motivo de rechazo
          newApprovalState[company.id] = {
            isApproved: company.isClientApproved,
            rejectionReason: company.nonApprovalReason || "",
          };

          console.log(
            `Inicializado: Cotización ${company.id} - ${company.companyName} - Aprobado: ${company.isClientApproved} - Motivo: ${company.nonApprovalReason || "N/A"}`
          );
        });
      });

      console.log("Estado de aprobación inicializado:", newApprovalState);
      setApprovalState(newApprovalState);

      // Calcular totales iniciales
      calculateTotals();
    }
  }, [requirementsWithQuotations]);

  const loadData = async (showLoading = true) => {
    try {
      // Solo mostrar loading en la carga inicial, no en refrescos
      if (showLoading) {
        setLoading(true);
      }
      
      // Paralelizar las peticiones para mejorar el rendimiento
      const [projectResponse, quotationsResponse] = await Promise.all([
        // Petición 1: Cargar información del proyecto para obtener el nombre del cliente
        fetch(`/api/project_requests/${projectRequestId}`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }),
        
        // Petición 2: Cargar cotizaciones para el cliente
        fetch(`/api/project_requests/${projectRequestId}/client-quotation`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        })
      ]);
      
      // Procesar la respuesta del proyecto
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        if (projectData.client && projectData.client.name) {
          setClientName(projectData.client.name);
        } else if (projectData.clientName) {
          setClientName(projectData.clientName);
        }
      }
      
      // Usar la respuesta de cotizaciones ya obtenida
      if (!quotationsResponse.ok) {
        throw new Error("Error al cargar las cotizaciones aprobadas");
      }

      const companiesData = await quotationsResponse.json();


      // Filtrar requerimientos que tienen al menos una cotización
      const requirementsWithData = companiesData.filter(
        (req: RequirementWithQuotations) =>
          req.quotations && req.quotations.length > 0
      );


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


        if (clientQuotationData.quotation) {
          setExistingQuotation(true);

          // Guardar el nombre del archivo
          const fileName =
            clientQuotationData.quotation.quotationFileName || null;

          // Asegurarse de que el nombre del archivo se establezca correctamente
          if (fileName) {
            setExistingFileName(fileName);

          } else {

            setExistingFileName(null);
          }

          setClientPrice(
            clientQuotationData.quotation.clientPrice
              ? formatCurrency(clientQuotationData.quotation.clientPrice)
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
            setRequirementsWithQuotations((prevRequirements) => {
              // Inicializar el estado de aprobación para todas las cotizaciones
              const newApprovalState: ApprovalState = {};

              // Recorrer todos los requerimientos y sus cotizaciones
              prevRequirements.forEach((req) => {
                req.quotations.forEach((company) => {
                  // Usar el estado isClientApproved de la cotización
                  // NO usar selectedIds para determinar si está aprobada

                  // Actualizar el estado de aprobación
                  newApprovalState[company.id] = {
                    isApproved: company.isClientApproved || false,
                    rejectionReason: company.nonApprovalReason || "",
                  };
                });
              });

              // Actualizar el estado de aprobación
              setApprovalState(newApprovalState);

              return prevRequirements.map((req) => ({
                ...req,
                quotations: req.quotations.map((company) => ({
                  ...company,
                  isClientSelected: selectedIds.includes(company.id),
                  // No modificar isClientApproved aquí, mantener el valor original
                })),
              }));
            });
          } else {
            // Si no hay empresas seleccionadas, inicializar el estado de aprobación vacío
            setApprovalState({});
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

    // Actualizar el estado de aprobación
    setApprovalState((prev) => {
      const newState = {
        ...prev,
        [quotationId]: {
          isApproved,
          rejectionReason: prev[quotationId]?.rejectionReason || "",
        },
      };

      // Calcular el nuevo precio total basado en el nuevo estado de aprobación
      // Considerar todas las cotizaciones de todos los requerimientos
      const newSelectedQuotations = requirementsWithQuotations.flatMap((req) =>
        req.quotations.filter((company) => {
          // Para la cotización que se está cambiando, usar el nuevo estado
          if (company.id === quotationId) {
            return isApproved;
          }
          // Para las demás cotizaciones, usar el estado actual en newState
          return newState[company.id]?.isApproved === true;
        })
      );

      console.log(
        "Cotizaciones seleccionadas después del cambio:",
        newSelectedQuotations
      );

      const newTotalPrice = newSelectedQuotations.reduce(
        (sum, company) => sum + (company.price ?? 0),
        0
      );

      console.log("Nuevo precio total calculado:", newTotalPrice);

      // Actualizar el precio al cliente directamente
      setClientPrice(formatCurrency(newTotalPrice));

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
    console.log(
      "Guardando aprobaciones/rechazos para todos los requerimientos"
    );
    console.log("Estado de aprobación actual:", approvalState);
    console.log("Requerimientos con cotizaciones:", requirementsWithQuotations);

    // Verificar que todas las cotizaciones tengan una decisión
    const pendingDecisions = requirementsWithQuotations.flatMap((req) =>
      req.quotations.filter(
        (company) =>
          !company.isClientApproved && approvalState[company.id] === undefined
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
      // Preparar los datos para enviar - procesamos TODAS las cotizaciones
      const updates: Array<{
        quotationId: number;
        isApproved: boolean;
        rejectionReason?: string;
      }> = [];

      // Procesar todas las cotizaciones de todos los requerimientos
      requirementsWithQuotations.forEach((req) => {
        console.log(
          `Procesando requerimiento: ${req.id} - ${req.requirementName}`
        );

        req.quotations.forEach((company) => {
          console.log(
            `Procesando cotización: ${company.id} - ${company.companyName}`
          );

          // Obtener el estado actual de aprobación
          const currentApprovalState = approvalState[company.id]?.isApproved;
          const currentReason =
            approvalState[company.id]?.rejectionReason || "";

          console.log(
            `Estado actual: ${currentApprovalState}, Estado guardado: ${company.isClientApproved}`
          );
          console.log(
            `Motivo actual: "${currentReason}", Motivo guardado: "${company.nonApprovalReason || ""}"`
          );

          // Siempre enviar el estado actual para todas las cotizaciones
          updates.push({
            quotationId: company.id,
            isApproved: !!currentApprovalState, // Convertir a booleano
            rejectionReason: !currentApprovalState ? currentReason : undefined,
          });
        });
      });

      console.log("Actualizaciones a enviar:", updates);

      // Enviar todas las actualizaciones en una sola llamada
      if (updates.length > 0) {
        try {
          console.log("Enviando actualizaciones...");
          const response = await fetch(
            `/api/project_requests/${projectRequestId}/requirement-quotation-approval`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
              },
              body: JSON.stringify({
                updates: updates,
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Error al actualizar cotizaciones:", errorData);
            toast.error(errorData.error || "Error al actualizar cotizaciones");
            return false;
          }

          console.log("Actualizaciones enviadas con éxito");

          // Actualizar el estado local para reflejar los cambios
          setRequirementsWithQuotations((prevRequirements) => {
            const updatedRequirements = prevRequirements.map((req) => ({
              ...req,
              quotations: req.quotations.map((company) => {
                // Actualizar según el estado actual en approvalState
                const newApprovalState = approvalState[company.id]?.isApproved;
                if (newApprovalState !== undefined) {
                  return {
                    ...company,
                    isClientApproved: newApprovalState,
                    nonApprovalReason: newApprovalState
                      ? null
                      : approvalState[company.id]?.rejectionReason,
                  };
                }
                return company;
              }),
            }));

            console.log("Requerimientos actualizados:", updatedRequirements);
            return updatedRequirements;
          });

          // Recargar los datos para asegurar que tenemos la información más actualizada
          console.log("Recargando datos...");
          await loadData(false);

          return true;
        } catch (error) {
          console.error("Error al actualizar cotizaciones:", error);
          toast.error("Error al actualizar cotizaciones");
          return false;
        }
      } else {
        console.log("No hay cambios para enviar");
        return true;
      }
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

    // Obtener el precio del cliente limpiando el formato
    const clientPriceValue = clientPrice
      ? parseFloat(clientPrice.replace(/[^0-9.]/g, ""))
      : 0;

    console.log("Precio del cliente para validación:", {
      original: clientPrice,
      limpio: clientPriceValue,
    });

    // Validar que se haya ingresado un precio para el cliente
    if (clientPriceValue <= 0) {
      toast.error("Debe ingresar un precio válido para el cliente");
      return;
    }

    // Validar que se haya seleccionado un archivo si es una nueva cotización
    if (!existingQuotation && !file && !existingFileName) {
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

      // Usar el precio del cliente limpio y formateado para el API
      const formattedPrice = clientPriceValue.toFixed(2);
      formData.append("clientPrice", formattedPrice);

      // Actualizar el estado de totales con el precio final
      setTotals((prev) => ({
        ...prev,
        clientPrice: clientPriceValue,
      }));

      // Usar la fecha actual
      const currentDate = new Date().toISOString().split("T")[0];
      formData.append("dateQuotationClient", currentDate);

      formData.append("observations", observations);

      console.log("Enviando datos de cotización:", {
        clientPrice: formattedPrice,
        clientPriceOriginal: clientPrice,
        dateQuotationClient: currentDate,
        observations,
        hasFile: !!file,
      });

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

  // Función para calcular los totales basados en las cotizaciones seleccionadas
  const calculateTotals = useCallback(() => {
    console.log("Calculando totales basados en cotizaciones seleccionadas");

    let totalMaterialCost = 0;
    let totalDirectCost = 0;
    let totalIndirectCost = 0;
    let totalPrice = 0;

    // Recorrer todos los requerimientos y sus cotizaciones
    requirementsWithQuotations.forEach((req) => {
      // Calcular subtotales por requerimiento
      let reqMaterialCost = 0;
      let reqDirectCost = 0;
      let reqIndirectCost = 0;
      let reqPrice = 0;

      // Solo considerar cotizaciones aprobadas
      req.quotations.forEach((company) => {
        const isApproved = approvalState[company.id]?.isApproved;

        if (isApproved) {
          // Convertir a número y asegurar que siempre sea un valor numérico
          reqMaterialCost += Number(company.materialCost || 0);
          reqDirectCost += Number(company.directCost || 0);
          reqIndirectCost += Number(company.indirectCost || 0);
          reqPrice += Number(company.price || 0);
        }
      });

      // Actualizar totales generales
      totalMaterialCost += reqMaterialCost;
      totalDirectCost += reqDirectCost;
      totalIndirectCost += reqIndirectCost;
      totalPrice += reqPrice;
    });

    // Actualizar el estado con los nuevos totales
    setTotals({
      materialCost: totalMaterialCost,
      directCost: totalDirectCost,
      indirectCost: totalIndirectCost,
      price: totalPrice,
      clientPrice: clientPrice
        ? parseFloat(clientPrice.replace(/[^0-9.]/g, ""))
        : totalPrice, // Mantener el precio al cliente si ya existe
    });

    console.log("Totales calculados:", {
      materialCost: totalMaterialCost,
      directCost: totalDirectCost,
      indirectCost: totalIndirectCost,
      price: totalPrice,
      clientPrice: clientPrice
        ? parseFloat(clientPrice.replace(/[^0-9.]/g, ""))
        : totalPrice,
    });
  }, [requirementsWithQuotations, approvalState, clientPrice]);

  // Recalcular totales cuando cambia el estado de aprobación
  useEffect(() => {
    if (requirementsWithQuotations.length > 0) {
      calculateTotals();
    }
  }, [approvalState, calculateTotals]);

  // Función para descargar el archivo de cotización
  const handleDownloadQuotation = async () => {
    if (!existingFileName) return;
    
    try {
      const response = await fetch(
        `/api/project_requests/${projectRequestId}/download-client-quotation`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("Error al descargar el archivo");
      }
      
      // Convertir la respuesta a blob
      const blob = await response.blob();
      
      // Crear URL para el blob
      const url = window.URL.createObjectURL(blob);
      
      // Crear un elemento <a> para descargar el archivo
      const a = document.createElement("a");
      a.href = url;
      a.download = existingFileName;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error al descargar el archivo:", error);
      toast.error("Error al descargar el archivo de cotización");
    }
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
                                        id={`company-${company.id}`}
                                        checked={
                                          approvalState[company.id]?.isApproved
                                        }
                                        onCheckedChange={(checked: boolean) => {
                                          handleApprovalChange(
                                            company.id,
                                            checked
                                          );
                                        }}
                                        disabled={submitting}
                                      />
                                      <Label
                                        htmlFor={`company-${company.id}`}
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
                                  
                                  {/* Fechas de entrega y observaciones */}
                                  {company.segments && company.segments.length > 0 && (
                                    <div className="mt-3 border-t pt-3">
                                      <h4 className="text-sm font-medium mb-2">Entregas:</h4>
                                      <div className="space-y-2">
                                        {company.segments.map((segment) => {
                                          // Formatear la fecha para mostrarla en formato local
                                          const date = new Date(segment.estimatedDeliveryDate);
                                          const formattedDate = date.toLocaleDateString('es-MX', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                          });
                                          
                                          return (
                                            <div key={segment.id} className="bg-muted/10 p-2 rounded-sm">
                                              <div className="flex flex-col md:flex-row md:gap-4">
                                                <div className="md:w-1/3">
                                                  <span className="text-xs text-muted-foreground block">Fecha de entrega:</span>
                                                  <span className="text-sm font-medium">{formattedDate}</span>
                                                </div>
                                                <div className="md:w-2/3">
                                                  <span className="text-xs text-muted-foreground block">Observaciones:</span>
                                                  <span className="text-sm">{segment.description}</span>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Detalles adicionales */}
                                  {company.additionalDetails && (
                                    <div className="mt-3 border-t pt-3">
                                      <h4 className="text-sm font-medium mb-1">Detalles adicionales:</h4>
                                      <p className="text-sm">{company.additionalDetails}</p>
                                    </div>
                                  )}

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
                                        approvalState[company.id]
                                          ?.isApproved === true
                                      }
                                      className="text-sm h-8 w-full"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Eliminada la sección de Subtotal por requerimiento */}
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
                      {formatCurrency(totals.materialCost)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Costo Directo</h4>
                    <p className="text-lg font-semibold">
                      {formatCurrency(totals.directCost)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">
                      Costo Indirecto
                    </h4>
                    <p className="text-lg font-semibold">
                      {formatCurrency(totals.indirectCost)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Precio Total</h4>
                    <p className="text-lg font-semibold text-primary">
                      {formatCurrency(totals.price)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-end items-center gap-2 pr-10">
                    <span className="font-medium text-base">Costo Total:</span>
                    <span className="text-lg font-semibold">
                      {formatCurrency(
                        parseFloat(
                          (
                            totals.materialCost +
                            totals.directCost +
                            totals.indirectCost
                          ).toFixed(2)
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="md:w-1/3">
                      <Label className="text-base font-medium mb-1 block">
                        Precio al Cliente:
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <Input
                          id="clientPrice"
                          type="text"
                          className="pl-7 text-lg"
                          placeholder="0"
                          value={clientPrice}
                          onChange={(e) => {
                            setClientPrice(e.target.value);
                          }}
                          onBlur={() => {
                            if (clientPrice) {
                              const priceAsNumber = parseFloat(
                                clientPrice.replace(/[^0-9.]/g, "")
                              );
                              setTotals((prev) => ({
                                ...prev,
                                clientPrice: priceAsNumber,
                              }));
                              const formattedPrice =
                                formatCurrency(priceAsNumber);
                              setClientPrice(formattedPrice);
                            } else {
                              const defaultPrice = totals.price;
                              setClientPrice(formatCurrency(defaultPrice));
                              setTotals((prev) => ({
                                ...prev,
                                clientPrice: defaultPrice,
                              }));
                            }
                          }}
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    <div className="md:w-2/3">
                      <div className="mb-1">
                        <Label className="text-base font-medium">
                          Archivo de Cotización:
                        </Label>
                        {existingFileName && (
                          <button
                            type="button"
                            onClick={handleDownloadQuotation}
                            className="ml-2 text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1"
                            title="Haz clic para descargar el archivo"
                          >
                            <span className="flex items-center">
                              <FileIcon className="h-3.5 w-3.5 mr-1" />
                              {existingFileName}
                            </span>
                          </button>
                        )}
                      </div>
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileChange}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="observations"
                      className="text-base font-medium mb-1 block"
                    >
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

                  <div className="flex justify-end gap-2 mt-4">
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
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
