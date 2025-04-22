import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Award,
  Building,
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  DollarSign,
  Download,
  Eye,
  File,
  FileDigit,
  FileText,
  ListChecks,
  Loader2,
  Medal,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectRequestWithRelations } from "@/lib/schemas/project_request";
import { TechnicalDocumentsDialog } from "./technical-documents-dialog";
import { ClientQuotationModal } from "./client-quotation-modal";
import { toast } from "sonner";
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
import ProjectRequestLogsModal from "@/app/(root)/(modules)/project_request_logs/components/project-request-logs-modal";
import UnreadIndicator from "@/app/(root)/(modules)/project_request_logs/components/unread-indicator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Interfaz para los requerimientos con los nuevos campos
interface ProjectRequirement {
  id: number;
  projectRequestId: number;
  requirementName: string;
  piecesNumber?: number | null;
  observation?: string | null;
  statusId: number;
  status: { id: number; name: string };
  isActive: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
  RequirementSpecialty?: any[];
  RequirementCertification?: any[];
  ProjectRequestCompany?: any[];
  [key: string]: any; // Para otras propiedades que puedan existir
}

interface ProjectRequestOverviewProps {
  data: ProjectRequestWithRelations;
  onManageRequirements?: (data: ProjectRequestWithRelations) => void;
  onManageSpecialties?: (requirement: ProjectRequirement) => void;
  onManageCertifications?: (requirement: ProjectRequirement) => void;
  onManageParticipants?: (requirement: ProjectRequirement) => void;
  onRefreshData?: () => void; // Nuevo prop para refrescar los datos
}

// Función para formatear la fecha para mostrar
function formatDateForDisplay(dateString: string | Date | undefined): string {
  if (!dateString) return "Fecha no disponible";

  // Crear una fecha a partir de la cadena
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Fecha inválida";

  // Usar toLocaleDateString para formatear la fecha correctamente según la configuración regional
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC", // Usar UTC para evitar ajustes de zona horaria
  });
}

// Función para formatear número como moneda
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

// Función para obtener el icono según el estado
function getStatusIcon(statusId: number) {
  switch (statusId) {
    case 1: // Pendiente
      return <AlertCircle className="h-3 w-3" />;
    case 2: // En proceso
      return <AlertCircle className="h-3 w-3" />;
    case 3: // En espera de firma NDA
      return <AlertCircle className="h-3 w-3" />;
    case 4: // Firmado por Asociado
      return <CheckSquare className="h-3 w-3" />;
    case 5: // Rechazado
      return <AlertCircle className="h-3 w-3" />;
    default:
      return <AlertCircle className="h-3 w-3" />;
  }
}

// Función para obtener los estilos del badge según el estado
function getStatusBadgeStyles(statusId: number) {
  switch (statusId) {
    case 1: // Pendiente
      return "bg-gray-50 text-gray-700";
    case 2: // En proceso
      return "bg-blue-50 text-blue-700";
    case 3: // En espera de firma NDA
      return "bg-amber-50 text-amber-700";
    case 4: // Firmado por Asociado
      return "bg-purple-50 text-purple-700";
    case 5: // En espera de Documentos Técnicos
      return "bg-red-50 text-red-700";
    case 6: // Documentos técnicos enviados
      return "bg-blue-100 text-blue-800";
    case 7: // Cotización enviada
      return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case 8: // No seleccionado
      return "bg-red-100 text-red-800";
    case 9: // Revisión Ok
      return "bg-green-100 text-green-800";
    case 10: // Finalizado
      return "bg-emerald-100 text-emerald-800";
    case 16: // En espera de aprobación
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-50 text-gray-700";
  }
}

export default function ProjectRequestOverview({
  data,
  onManageRequirements,
  onManageSpecialties,
  onManageCertifications,
  onManageParticipants,
  onRefreshData, // Nuevo prop para refrescar los datos
}: ProjectRequestOverviewProps) {
  const [expandedRequirements, setExpandedRequirements] = useState<{
    [key: number]: boolean;
  }>({});
  const [technicalDocsOpen, setTechnicalDocsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [clientQuotationOpen, setClientQuotationOpen] = useState(false);
  const [clientQuotationData, setClientQuotationData] = useState<{
    id: number;
    clientPrice: number;
    observations: string;
    quotationFileName: string;
    dateQuotationClient: string;
    dateQuotationSent: string;
    totals?: {
      materialCost: number;
      directCost: number;
      indirectCost: number;
      price: number;
    };
  } | null>(null);
  const [downloadingClientQuotation, setDownloadingClientQuotation] =
    useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    action: "approve" | "reject";
    participant: any;
  } | null>(null);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [selectedCompanyForLogs, setSelectedCompanyForLogs] = useState<{
    companyId: number;
    requirementId: number;
    companyName: string;
    requirementName: string;
  } | null>(null);
  const [updatingQuotationStatus, setUpdatingQuotationStatus] = useState(false);
  const [approvingClientQuotation, setApprovingClientQuotation] =
    useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Agregar estados faltantes
  const [downloadingQuote, setDownloadingQuote] = useState<number | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  // Estado para almacenar información de NDAs válidos
  const [validNdas, setValidNdas] = useState<Record<number, boolean>>({});

  // Estado para controlar si ya se verificaron los NDAs
  const [ndasChecked, setNdasChecked] = useState<boolean>(false);

  // Estado para evitar múltiples verificaciones simultáneas
  const [isCheckingNdas, setIsCheckingNdas] = useState<boolean>(false);

  // Función para verificar NDAs para todos los requerimientos
  const checkNdasForAllRequirements = async () => {
    // Evitar verificaciones múltiples simultáneas
    if (isCheckingNdas) return;

    try {
      setIsCheckingNdas(true);

      if (!data || !data.id || !requirements || requirements.length === 0) {
        // No hay datos o requerimientos para verificar NDAs
        setIsCheckingNdas(false);
        return;
      }

      // Crear un nuevo objeto para almacenar el estado actualizado
      const newNdaState: Record<number, boolean> = { ...validNdas }; // Mantener el estado anterior

      // Procesar los requerimientos de forma secuencial para evitar sobrecarga
      for (const requirement of requirements) {
        try {
          const token = await getToken();
          const response = await fetch(
            `/api/project_requests/${data.id}/requirements/${requirement.id}/check_ndas`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              // Añadir un timeout para evitar solicitudes que nunca terminen
              signal: AbortSignal.timeout(10000), // 10 segundos de timeout
            }
          );

          if (response.ok) {
            const ndaData = await response.json();

            // Para cada asociado en el requerimiento, verificar si tiene un NDA válido
            if (
              ndaData &&
              ndaData.ndaResults &&
              ndaData.ndaResults.length > 0
            ) {
              ndaData.ndaResults.forEach((item: any) => {
                if (item.companyId && item.hasNDA) {
                  newNdaState[item.companyId] = true;
                } else if (item.companyId) {
                  newNdaState[item.companyId] = false;
                }
              });
            }
          } else {
            console.error(
              `Error al verificar NDAs para requerimiento ${requirement.id}:`,
              response.statusText
            );
          }

          // Añadir un pequeño retraso entre solicitudes para evitar sobrecarga
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error) {
          // Capturar errores por requerimiento para que un error no detenga todo el proceso
          if (error instanceof DOMException && error.name === "AbortError") {
            console.error(
              `Timeout al verificar NDAs para requerimiento ${requirement.id}`
            );
          } else {
            console.error(
              `Error al verificar NDAs para requerimiento ${requirement.id}:`,
              error
            );
          }
          // Continuar con el siguiente requerimiento
          continue;
        }
      }

      setValidNdas(newNdaState);
      setNdasChecked(true); // Marcar que ya se verificaron los NDAs
    } catch (error) {
      console.error("Error general al verificar NDAs:", error);
      // No modificar el estado en caso de error para mantener los valores anteriores
    } finally {
      setIsCheckingNdas(false);
    }
  };

  // Extraer los requerimientos para facilitar su uso
  const requirements =
    (data?.ProjectRequirements?.filter(
      (req) => req.isActive && !req.isDeleted
    ) as ProjectRequirement[]) || [];

  // Ejecutar la verificación de NDAs cuando cambian los requerimientos
  useEffect(() => {
    // Si no hay requerimientos, no es necesario verificar NDAs
    if (!requirements || requirements.length === 0) return;

    // Si ya se verificaron los NDAs y no han cambiado los datos, no volver a verificar
    if (ndasChecked && !isCheckingNdas) return;

    // Usar un temporizador para evitar múltiples llamadas
    const timer = setTimeout(() => {
      checkNdasForAllRequirements();
    }, 1500);

    // Limpiar el temporizador si el componente se desmonta o los datos cambian
    return () => clearTimeout(timer);
  }, [data, requirements]);

  // Depuración: Imprimir los datos recibidos para verificar su estructura

  useEffect(() => {
    // console.log("ProjectRequestOverview - Datos recibidos:", data);
    // console.log("ProjectRequirements:", data.ProjectRequirements);
  }, [data]);

  // Depuración: Verificar los requerimientos filtrados
  useEffect(() => {
    //console.log("Requerimientos filtrados:", requirements);
  }, [requirements]);

  // Ya no necesitamos cargar especialidades desde un endpoint separado
  // ya que ahora los requerimientos vienen directamente en la respuesta de la solicitud

  // Función para abrir el modal de documentos técnicos
  const handleOpenTechnicalDocs = (participant: any, requirementId: number) => {
    //console.log("Abriendo documentos técnicos para:", participant);

    // Verificar que participant.Company existe y tiene un ID
    if (!participant.Company || !participant.Company.id) {
      console.error("Error: No se encontró el ID de la compañía", participant);
      return;
    }

    setSelectedCompany({
      id: participant.Company.id, // Usar el ID de la compañía, no el ID del participante
      requirementId,
      name: participant.Company?.comercialName || "Empresa sin nombre",
    });
    setTechnicalDocsOpen(true);
  };

  // Función para refrescar los datos cuando se cierra el diálogo de documentos técnicos
  const handleRefreshData = () => {
    if (onRefreshData) {
      onRefreshData();
      // Resetear el estado de verificación para forzar una nueva verificación
      setNdasChecked(false);
    }

    // Verificar NDAs después de refrescar los datos solo si no se están verificando ya
    if (!isCheckingNdas) {
      setTimeout(() => {
        checkNdasForAllRequirements();
      }, 1200);
    }
  };

  const handleDownloadQuote = async (participant: any) => {
    try {
      setDownloadingQuote(participant.id);

      // Primero, obtener el nombre del archivo de la cotización
      const quoteInfoResponse = await fetch(
        `/api/assigned_companies/${participant.id}/quotation-info`
      );

      if (!quoteInfoResponse.ok) {
        throw new Error("Error al obtener información de la cotización");
      }

      const quoteInfo = await quoteInfoResponse.json();
      const fileName =
        quoteInfo.quotationFileName || `cotizacion-${participant.id}.xlsx`;

      // Luego, descargar el archivo
      const response = await fetch(
        `/api/assigned_companies/${participant.id}/download-quote`
      );

      if (!response.ok) {
        throw new Error("Error al descargar la cotización");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = window.document.createElement("a");
      a.href = url;
      a.download = fileName;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);

      toast.success("Cotización descargada correctamente");
    } catch (error) {
      console.error("Error downloading quote:", error);
      toast.error("Error al descargar la cotización");
    } finally {
      setDownloadingQuote(null);
    }
  };

  const handleConfirmAction = (
    participant: any,
    action: "approve" | "reject"
  ) => {
    const title =
      action === "approve" ? "Aprobar Cotización" : "No Seleccionar Cotización";
    const description =
      action === "approve"
        ? "¿Estás seguro de que deseas aprobar esta cotización? Esta acción no se puede deshacer."
        : "¿Estás seguro de que no deseas seleccionar esta cotización? Esta acción no se puede deshacer.";

    setConfirmAction({
      title,
      description,
      action,
      participant,
    });
    setConfirmDialogOpen(true);
  };

  const handleUpdateQuotationStatus = async () => {
    if (!confirmAction) return;

    try {
      setUpdatingStatus(confirmAction.participant.id);
      setUpdatingQuotationStatus(true);

      const response = await fetch(
        `/api/assigned_companies/${confirmAction.participant.id}/update-quotation-status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            status:
              confirmAction.action === "approve" ? "approved" : "rejected",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al actualizar el estado de la cotización");
      }

      toast.success(
        confirmAction.action === "approve"
          ? "Cotización aprobada correctamente"
          : "Cotización marcada como no seleccionada"
      );

      // Refrescar los datos
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      console.error("Error updating quotation status:", error);
      toast.error("Error al actualizar el estado de la cotización");
    } finally {
      setUpdatingStatus(null);
      setUpdatingQuotationStatus(false);
      setConfirmDialogOpen(false);
      setConfirmAction(null);
    }
  };

  // Función para descargar la cotización para cliente
  const handleDownloadClientQuotation = async () => {
    try {
      setDownloadingClientQuotation(true);

      // Descargar el archivo
      const downloadResponse = await fetch(
        `/api/project_requests/${data.id}/download-client-quotation`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!downloadResponse.ok) {
        throw new Error("Error al descargar el archivo de cotización");
      }

      // Crear un blob y descargar el archivo
      const blob = await downloadResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        clientQuotationData?.quotationFileName || "cotizacion-cliente.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Cotización descargada correctamente");
    } catch (error: any) {
      console.error("Error al descargar cotización para cliente:", error);
      toast.error(error.message || "Error al descargar la cotización");
    } finally {
      setDownloadingClientQuotation(false);
    }
  };

  // Función para cargar los datos de la cotización para cliente
  const loadClientQuotationData = async () => {
    try {
      const response = await fetch(
        `/api/project_requests/${data.id}/client-quotation`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (response.ok) {
        const responseData = await response.json();

        // Verificar si la respuesta tiene la estructura esperada
        if (responseData && responseData.quotation) {
          // La API devuelve la cotización en responseData.quotation
          const quotation = responseData.quotation;

          // Calcular los totales basados en las empresas seleccionadas
          let materialCostTotal = 0;
          let directCostTotal = 0;
          let indirectCostTotal = 0;
          let priceTotal = 0;

          // Si hay empresas seleccionadas, calcular los totales
          if (
            responseData.selectedCompanies &&
            responseData.selectedCompanies.length > 0
          ) {
            responseData.selectedCompanies.forEach((company: any) => {
              materialCostTotal += company.materialCost || 0;
              directCostTotal += company.directCost || 0;
              indirectCostTotal += company.indirectCost || 0;
              // Calcular el precio como la suma de los costos
              priceTotal +=
                (company.materialCost || 0) +
                (company.directCost || 0) +
                (company.indirectCost || 0);
            });
          }

          setClientQuotationData({
            id: quotation.id,
            clientPrice: quotation.clientPrice || 0,
            observations: quotation.observations || "",
            quotationFileName: quotation.quotationFileName || "",
            dateQuotationClient: quotation.dateQuotationClient || "",
            dateQuotationSent: quotation.dateQuotationSent || "",
            totals: {
              materialCost: materialCostTotal,
              directCost: directCostTotal,
              indirectCost: indirectCostTotal,
              price: priceTotal,
            },
          });
        } else {
          setClientQuotationData(null);
        }
      } else {
        setClientQuotationData(null);
      }
    } catch (error) {
      console.error("Error al cargar datos de cotización para cliente:", error);
      setClientQuotationData(null);
    }
  };

  // Cargar los datos de la cotización para cliente al montar el componente
  useEffect(() => {
    if (data?.id) {
      loadClientQuotationData();
      // Verificar NDAs para todos los requerimientos al cargar la página
      checkNdasForAllRequirements();
    }
  }, [data?.id]);

  // Función para manejar el éxito al guardar la cotización para cliente
  const handleClientQuotationSuccess = () => {
    loadClientQuotationData();
    if (onRefreshData) {
      onRefreshData();
    }
  };

  const handleOpenLogsModal = (
    companyId: number,
    requirementId: number,
    companyName: string,
    requirementName: string
  ) => {
    console.log(
      `Abriendo modal de bitácora para Compañía=${companyId}, Requerimiento=${requirementId}`
    );
    setSelectedCompanyForLogs({
      companyId,
      requirementId,
      companyName,
      requirementName,
    });
    setIsLogsModalOpen(true);
  };

  const handleReviewOk = async (participant: any, requirementId: number) => {
    try {
      setUpdatingStatus(participant.id);

      const response = await fetch(
        `/api/assigned_companies/${participant.id}/update-status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            statusId: 9, // ID 9 para estado "Revisión Ok"
            requirementId: requirementId, // Incluir el ID del requerimiento para la bitácora
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al actualizar el estado de la cotización");
      }

      toast.success("Cotización marcada como Revisión Ok correctamente");

      // Refrescar los datos
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      console.error("Error updating quotation status:", error);
      toast.error("Error al actualizar el estado de la cotización");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleApproveClientQuotation = async () => {
    try {
      setApprovingClientQuotation(true);
      const response = await fetch(
        `/api/project_requests/${data.id}/approve-client-quotation`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al aprobar la cotización para cliente");
      }

      toast.success("Cotización para cliente aprobada correctamente");

      // Refrescar los datos
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      console.error("Error approving client quotation:", error);
      toast.error("Error al aprobar la cotización para cliente");
    } finally {
      setApprovingClientQuotation(false);
    }
  };

  const handleRejectClientQuotation = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Debe ingresar un motivo de rechazo");
      return;
    }

    try {
      setApprovingClientQuotation(true);
      const response = await fetch(
        `/api/project_requests/${data.id}/reject-client-quotation`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rejectionReason: rejectionReason.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al rechazar la cotización para cliente");
      }

      toast.success("Cotización para cliente rechazada correctamente");
      setRejectDialogOpen(false);
      setRejectionReason("");

      // Refrescar los datos
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      console.error("Error rejecting client quotation:", error);
      toast.error("Error al rechazar la cotización para cliente");
    } finally {
      setApprovingClientQuotation(false);
    }
  };

  return (
    <>
      <div className="p-6 bg-card rounded-lg shadow-lg mt-4 mb-6">
        <div className="flex flex-col space-y-6">
          {/* Fila 1: Título y Fecha */}
          <div className="flex flex-col items-center space-y-3">
            <h2 className="text-xl font-semibold text-center">{data.title}</h2>
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span>
                {formatDateForDisplay(data.requestDate || data.createdAt)}
              </span>
            </div>
          </div>

          {/* Fila 2: Cliente y Área */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-primary" />
              <span className="text-lg font-medium">
                Cliente:{" "}
                {(data.clientArea as any)?.client?.name || "No especificado"}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm pl-7">
              <span>
                Área: {(data.clientArea as any)?.areaName || "No especificada"}
              </span>
              {(data.clientArea as any)?.contactName && (
                <>
                  <span className="mx-1">|</span>
                  <span>Contacto: {(data.clientArea as any).contactName}</span>
                </>
              )}
              {(data.clientArea as any)?.contactEmail && (
                <>
                  <span className="mx-1">|</span>
                  <span>Correo: {(data.clientArea as any).contactEmail}</span>
                </>
              )}
              {(data.clientArea as any)?.contactPhone && (
                <>
                  <span className="mx-1">|</span>
                  <span>Teléfono: {(data.clientArea as any).contactPhone}</span>
                </>
              )}
            </div>
          </div>

          {/* Fila 3: Observaciones */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Observaciones</span>
            </h3>
            <div className="text-sm">
              {data.observation ? (
                <p className="whitespace-pre-line">{data.observation}</p>
              ) : (
                <p className="text-muted-foreground italic">
                  Sin observaciones
                </p>
              )}
            </div>
          </div>

          {/* Divisor */}
          <div className="border-t border-gray-200 my-2"></div>

          {/* Fila 4: Requerimientos */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <ClipboardList className="w-5 h-5" />
                <span>Requerimientos</span>
              </h3>
              {onManageRequirements && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => onManageRequirements(data)}
                >
                  <ListChecks className="h-4 w-4" />
                  <span>Gestionar Requerimientos</span>
                </Button>
              )}
            </div>

            {/* Contenedor para Requerimientos con sus especialidades, certificaciones y asociados */}
            <div className="border rounded-lg p-4 space-y-6">
              {requirements && requirements.length > 0 ? (
                requirements.map((requirement, index) => (
                  <div
                    key={index}
                    className="border-b pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <ClipboardList className="w-5 h-5 text-primary" />
                          <h4 className="text-base font-medium">
                            {requirement.requirementName}
                          </h4>
                        </div>

                        {(requirement.piecesNumber ||
                          requirement.observation) && (
                          <div className="mt-4 ml-7 text-sm text-muted-foreground">
                            {requirement.piecesNumber !== null &&
                              requirement.piecesNumber !== undefined && (
                                <div className="mb-2">
                                  <span className="text-sm font-medium">
                                    Número de piezas:
                                  </span>{" "}
                                  {requirement.piecesNumber}
                                </div>
                              )}
                            {requirement.observation && (
                              <div className="mb-2">
                                <span className="text-sm font-medium">
                                  Observación:{" "}
                                </span>
                                {requirement.observation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Especialidades del requerimiento */}
                    <div className="ml-7 mb-3">
                      <h5 className="text-sm font-medium mb-2 flex items-center">
                        <Award className="h-4 w-4 mr-1 text-amber-500" />
                        <span>Especialidades</span>
                      </h5>
                      {requirement.RequirementSpecialty &&
                      requirement.RequirementSpecialty.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {requirement.RequirementSpecialty.map((spec: any) => (
                            <div
                              key={spec.id}
                              className="border rounded p-2 text-sm"
                            >
                              <div className="font-medium">
                                {spec.specialty?.name || "Sin nombre"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {spec.scope?.name && (
                                  <span>Alcance: {spec.scope.name}</span>
                                )}
                                {spec.subscope?.name && (
                                  <span>
                                    {" "}
                                    | Subalcance: {spec.subscope.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No hay especialidades registradas
                        </p>
                      )}
                    </div>

                    {/* Certificaciones del requerimiento */}
                    <div className="ml-7 mb-3">
                      <h5 className="text-sm font-medium mb-2 flex items-center">
                        <Medal className="h-4 w-4 mr-1 text-blue-500" />
                        <span>Certificaciones</span>
                      </h5>
                      {requirement.RequirementCertification &&
                      requirement.RequirementCertification.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {requirement.RequirementCertification.map(
                            (cert: any) => (
                              <div
                                key={cert.id}
                                className="border rounded p-2 text-sm"
                              >
                                <div className="font-medium">
                                  {cert.certification?.name || "Sin nombre"}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No hay certificaciones registradas
                        </p>
                      )}
                    </div>

                    {/* Asociados seleccionados para este requerimiento */}
                    <div className="ml-7">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="text-sm font-medium flex items-center">
                          <Users className="h-4 w-4 mr-1 text-green-500" />
                          <span>Asociados seleccionados</span>
                        </h5>
                        {onManageParticipants &&
                          ((requirement.RequirementSpecialty &&
                            requirement.RequirementSpecialty.length > 0) ||
                            (requirement.RequirementCertification &&
                              requirement.RequirementCertification.length >
                                0)) && (
                            <Button
                              variant="ghost"
                              onClick={() => {
                                // Asegurarse de que el objeto requirement incluya el projectRequestId
                                const requirementWithProjectId = {
                                  ...requirement,
                                  projectRequestId: data.id,
                                };
                                onManageParticipants(
                                  requirementWithProjectId as ProjectRequirement
                                );
                              }}
                              title="Gestionar asociados"
                              className="h-8 px-2 flex items-center gap-1"
                            >
                              <Users className="h-4 w-4" />
                              <span className="text-xs">Asociados</span>
                            </Button>
                          )}
                      </div>
                      {requirement.ProjectRequestCompany &&
                      requirement.ProjectRequestCompany.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {requirement.ProjectRequestCompany.map(
                            (participant: any) => (
                              <div
                                key={participant.id}
                                className="border rounded-md p-3 text-sm hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <div className="font-medium">
                                      {participant.Company?.comercialName ||
                                        "Empresa sin nombre"}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                                      <span>
                                        {participant.Company?.contactName ||
                                          "Sin contacto"}
                                      </span>
                                      <span className="text-slate-300">|</span>
                                      <span>
                                        {participant.Company?.email ||
                                          "Sin correo"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    {participant.status && (
                                      <Badge
                                        className={`flex items-center space-x-1 border-0 pointer-events-none ${getStatusBadgeStyles(participant.status.id)}`}
                                      >
                                        {getStatusIcon(participant.status.id)}
                                        <span>{participant.status.name}</span>
                                      </Badge>
                                    )}
                                    {participant.status &&
                                      participant.status.id === 7 && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-1 border-green-500/50 hover:border-green-600 hover:bg-green-50"
                                          onClick={() =>
                                            handleReviewOk(
                                              participant,
                                              requirement.id
                                            )
                                          }
                                          disabled={
                                            updatingStatus === participant.id
                                          }
                                        >
                                          {updatingStatus === participant.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Check className="h-3 w-3 text-green-600" />
                                          )}
                                          <span className="text-xs">
                                            {updatingStatus === participant.id
                                              ? "Actualizando..."
                                              : "Revisión OK"}
                                          </span>
                                        </Button>
                                      )}
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1 relative"
                                    onClick={() =>
                                      handleOpenLogsModal(
                                        participant.Company.id,
                                        requirement.id,
                                        participant.Company.comercialName,
                                        requirement.requirementName
                                      )
                                    }
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Bitácora
                                    <UnreadIndicator
                                      projectRequestId={data.id}
                                      companyId={participant.Company.id}
                                      requirementId={requirement.id}
                                    />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={() =>
                                      handleOpenTechnicalDocs(
                                        participant,
                                        requirement.id
                                      )
                                    }
                                    title={
                                      validNdas[participant.Company.id]
                                        ? "Ver documentos técnicos"
                                        : "Se requiere un NDA válido"
                                    }
                                    disabled={
                                      !validNdas[participant.Company.id]
                                    }
                                  >
                                    <File className="h-3 w-3" />
                                    <span className="text-xs">
                                      Documentos técnicos
                                    </span>
                                  </Button>
                                  {participant.status &&
                                    [7, 8, 9].includes(
                                      participant.status.id
                                    ) && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-1"
                                        onClick={() =>
                                          handleDownloadQuote(participant)
                                        }
                                        disabled={
                                          downloadingQuote === participant.id
                                        }
                                      >
                                        {downloadingQuote === participant.id ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Download className="h-3 w-3" />
                                        )}
                                        <span className="text-xs">
                                          {downloadingQuote === participant.id
                                            ? "Descargando..."
                                            : "Descargar cotización"}
                                        </span>
                                      </Button>
                                    )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No hay asociados seleccionados
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center space-x-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>No hay requerimientos definidos</span>
                </div>
              )}
            </div>
          </div>

          {/* Divisor */}
          <div className="border-t border-gray-200 my-2"></div>

          {/* Nueva sección: Cotizaciones para Cliente */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <FileDigit className="w-5 h-5" />
                <span>Cotizaciones para Cliente</span>
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span>
                    {data.statusId === 11 ? (
                      <Send className="h-4 w-4 text-purple-600" />
                    ) : (
                      <Clock
                        className={`h-4 w-4 ${
                          data.statusId === 10
                            ? "text-blue-600"
                            : data.statusId >= 12
                              ? "text-green-600"
                              : "text-muted-foreground"
                        }`}
                      />
                    )}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      data.statusId === 10
                        ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        : data.statusId === 11
                          ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                          : data.statusId >= 12
                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            : ""
                    }
                  >
                    {data?.status?.name || `Estado ${data.statusId}`}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setClientQuotationOpen(true)}
                >
                  <FileDigit className="h-4 w-4" />
                  <span>Cotización para Cliente</span>
                </Button>
              </div>
            </div>

            {/* Contenedor para la información de cotización para cliente */}
            <div className="border rounded-lg p-4">
              {clientQuotationData ? (
                <div className="space-y-4">
                  {/* Costos Generales */}
                  <div className="bg-muted/30 p-4 rounded-lg mb-4">
                    <h3 className="font-semibold mb-3">Totales Generales</h3>

                    {/* Primera fila: Costo Material, Costo Directo y Costo Indirecto */}
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          Costo Material
                        </h4>
                        <p className="text-lg font-semibold">
                          {formatCurrency(
                            clientQuotationData?.totals?.materialCost || 0
                          )}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          Costo Directo
                        </h4>
                        <p className="text-lg font-semibold">
                          {formatCurrency(
                            clientQuotationData?.totals?.directCost || 0
                          )}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          Costo Indirecto
                        </h4>
                        <p className="text-lg font-semibold">
                          {formatCurrency(
                            clientQuotationData?.totals?.indirectCost || 0
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Segunda fila: Precio Total (izquierda) y Costo Total (derecha) */}
                    <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          Precio Total
                        </h4>
                        <p className="text-lg font-semibold text-primary">
                          {formatCurrency(
                            clientQuotationData?.totals?.price || 0
                          )}
                        </p>
                      </div>
                      <div></div> {/* Columna vacía en el medio */}
                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          Costo Total
                        </h4>
                        <p className="text-lg font-semibold">
                          {formatCurrency(
                            (clientQuotationData?.totals?.materialCost || 0) +
                              (clientQuotationData?.totals?.directCost || 0) +
                              (clientQuotationData?.totals?.indirectCost || 0)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Precio al Cliente</h4>
                      <p className="text-lg font-semibold text-primary">
                        {formatCurrency(clientQuotationData.clientPrice || 0)}
                      </p>
                    </div>

                    {clientQuotationData.dateQuotationClient && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Fecha de Cotización</h4>
                        <p className="text-sm">
                          {formatDateForDisplay(
                            clientQuotationData.dateQuotationClient
                          )}
                        </p>
                      </div>
                    )}

                    {clientQuotationData.quotationFileName && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Archivo de Cotización</h4>
                        <div className="flex flex-col space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={handleDownloadClientQuotation}
                            disabled={downloadingClientQuotation}
                          >
                            {downloadingClientQuotation ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            <span className="text-sm">
                              {clientQuotationData.quotationFileName}
                            </span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {clientQuotationData.observations && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Observaciones</h4>
                      <p className="text-sm whitespace-pre-line">
                        {clientQuotationData.observations}
                      </p>
                    </div>
                  )}

                  {/* Botones de Aceptar y Rechazar cotización */}
                  <div className="mt-6 border-t pt-4 flex justify-end items-center">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={handleApproveClientQuotation}
                        disabled={approvingClientQuotation}
                      >
                        {approvingClientQuotation ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Aceptar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive hover:bg-red-50"
                        onClick={() => setRejectDialogOpen(true)}
                        disabled={approvingClientQuotation}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <p>No hay cotización para cliente definida</p>
                </div>
              )}
            </div>
          </div>

          {/* Fin de cotizaciones para cliente */}
        </div>
      </div>

      {/* Modal de Documentos Técnicos */}
      {selectedCompany && (
        <TechnicalDocumentsDialog
          open={technicalDocsOpen}
          onOpenChange={(open) => {
            setTechnicalDocsOpen(open);
            if (!open) {
              handleRefreshData();
            }
          }}
          companyId={selectedCompany.id}
          requirementId={selectedCompany.requirementId}
          companyName={selectedCompany.name}
          onDocumentsChanged={handleRefreshData}
        />
      )}

      {/* Modal de Cotizaciones para Cliente */}
      <ClientQuotationModal
        open={clientQuotationOpen}
        onOpenChange={setClientQuotationOpen}
        projectRequestId={data.id}
        onSuccess={handleClientQuotationSuccess}
      />

      {/* Diálogo de confirmación para aprobar/no seleccionar cotización */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConfirmDialogOpen(false);
                setConfirmAction(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateQuotationStatus}>
              {confirmAction?.action === "approve"
                ? "Aprobar"
                : "No seleccionar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para rechazar cotización */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rechazar Cotización</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor, ingrese el motivo por el cual se rechaza la cotización.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rejectionReason" className="text-left">
                Motivo de rechazo
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setRejectionReason(e.target.value)
                }
                placeholder="Ingrese el motivo de rechazo"
                className="min-h-[100px]"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRejectClientQuotation}
              disabled={!rejectionReason.trim() || approvingClientQuotation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {approvingClientQuotation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Rechazar Cotización"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de logs de seguimiento */}
      <ProjectRequestLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => {
          setIsLogsModalOpen(false);
          setSelectedCompanyForLogs(null);
        }}
        projectRequestId={data.id}
        companyId={selectedCompanyForLogs?.companyId}
        requirementId={selectedCompanyForLogs?.requirementId}
        requirementName={selectedCompanyForLogs?.requirementName}
        title={`Bitácora - ${selectedCompanyForLogs?.companyName || "Asociado"}`}
      />
    </>
  );
}
