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
import ProjectRequestLogsModal from "../../project_request_logs/components/project-request-logs-modal";

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
    case 8: // Cotización rechazada
      return "bg-red-100 text-red-800";
    case 9: // Revisión Ok
      return "bg-green-100 text-green-800";
    case 10: // Finalizado
      return "bg-emerald-100 text-emerald-800";
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
  const [showTechnicalDocsDialog, setShowTechnicalDocsDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedRequirementId, setSelectedRequirementId] = useState<
    number | null
  >(null);
  const [downloadingQuote, setDownloadingQuote] = useState<number | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    participantId: number;
    action: "approve" | "reject";
    title: string;
    description: string;
  } | null>(null);

  // Estado para almacenar información de NDAs válidos
  const [validNdas, setValidNdas] = useState<Record<number, boolean>>({});

  // Estado para controlar si ya se verificaron los NDAs
  const [ndasChecked, setNdasChecked] = useState<boolean>(false);

  // Estado para evitar múltiples verificaciones simultáneas
  const [isCheckingNdas, setIsCheckingNdas] = useState<boolean>(false);

  // Estado para el modal de documentos técnicos
  const [technicalDocsOpen, setTechnicalDocsOpen] = useState(false);

  // Estado para el modal de cotizaciones para cliente
  const [clientQuotationOpen, setClientQuotationOpen] = useState(false);
  const [clientQuotationData, setClientQuotationData] = useState<any>(null);
  const [downloadingClientQuotation, setDownloadingClientQuotation] =
    useState(false);
  const [sendingClientQuotation, setSendingClientQuotation] = useState(false);
  const [sendQuotationDialogOpen, setSendQuotationDialogOpen] = useState(false);

  // Estado para el modal de logs de seguimiento
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedCompanyForLogs, setSelectedCompanyForLogs] = useState<{
    id: number;
    name: string;
    requirementName: string;
  } | null>(null);

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
    // Preparar el diálogo de confirmación según la acción
    if (action === "approve") {
      setConfirmAction({
        participantId: participant.id,
        action: "approve",
        title: "Aprobar cotización",
        description: `¿Está seguro que desea aprobar la cotización de ${participant.Company?.comercialName || "la empresa seleccionada"}?`,
      });
    } else {
      setConfirmAction({
        participantId: participant.id,
        action: "reject",
        title: "Rechazar cotización",
        description: `¿Está seguro que desea rechazar la cotización de ${participant.Company?.comercialName || "la empresa seleccionada"}?`,
      });
    }

    // Abrir el diálogo de confirmación
    setConfirmDialogOpen(true);
  };

  const handleUpdateQuotationStatus = async () => {
    if (!confirmAction) return;

    try {
      setUpdatingStatus(confirmAction.participantId);

      // Determinar el nuevo estado según la acción
      const newStatusId = confirmAction.action === "approve" ? 9 : 8; // 9: Revisión Ok, 8: Cotización rechazada

      // Llamar a la API para actualizar el estado
      const response = await fetch(
        `/api/assigned_companies/${confirmAction.participantId}/update-status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            statusId: newStatusId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Error al ${confirmAction.action === "approve" ? "aprobar" : "rechazar"} la cotización`
        );
      }

      // Mostrar mensaje de éxito
      toast.success(
        `Cotización ${confirmAction.action === "approve" ? "aprobada" : "rechazada"} correctamente`
      );

      // Refrescar los datos sin mostrar el indicador de carga
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      console.error("Error updating quotation status:", error);
      toast.error(
        `Error al ${confirmAction.action === "approve" ? "aprobar" : "rechazar"} la cotización`
      );
    } finally {
      setUpdatingStatus(null);
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
        clientQuotationData.quotationFileName || "cotizacion-cliente.xlsx";
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

  // Función para enviar la cotización al cliente
  const handleSendClientQuotation = async () => {
    // Abrir el diálogo de confirmación
    setSendQuotationDialogOpen(true);
  };

  // Función que se ejecuta cuando se confirma el envío de la cotización
  const handleConfirmSendQuotation = async () => {
    try {
      setSendingClientQuotation(true);

      // Enviar la cotización al cliente
      const response = await fetch(
        `/api/project_requests/${data.id}/send-client-quotation`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error al enviar la cotización al cliente"
        );
      }

      toast.success("Cotización enviada al cliente correctamente");

      // Refrescar los datos si existe la función
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error: any) {
      console.error("Error al enviar cotización al cliente:", error);
      toast.error(error.message || "Error al enviar la cotización al cliente");
    } finally {
      setSendingClientQuotation(false);
      setSendQuotationDialogOpen(false);
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
        const data = await response.json();
        setClientQuotationData(data.quotation);
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

  // Función para abrir el modal de logs de seguimiento
  const handleOpenLogsModal = (participant: any, requirementName: string) => {
    if (!participant.Company || !participant.Company.id) {
      console.error("Error: No se encontró el ID de la compañía", participant);
      return;
    }

    setSelectedCompanyForLogs({
      id: participant.Company.id,
      name: participant.Company?.comercialName || "Empresa sin nombre",
      requirementName,
    });
    setLogsModalOpen(true);
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
                Cliente: {data.clientArea?.client?.name || "No especificado"}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm pl-7">
              <span>Área: {data.clientArea?.name || "No especificada"}</span>
              {data.clientArea?.contactName && (
                <>
                  <span className="mx-1">|</span>
                  <span>Contacto: {data.clientArea.contactName}</span>
                </>
              )}
              {data.clientArea?.contactEmail && (
                <>
                  <span className="mx-1">|</span>
                  <span>Correo: {data.clientArea.contactEmail}</span>
                </>
              )}
              {data.clientArea?.contactPhone && (
                <>
                  <span className="mx-1">|</span>
                  <span>Teléfono: {data.clientArea.contactPhone}</span>
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
                      <div className="flex space-x-1">
                        {onManageSpecialties && (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              // Asegurarse de que el objeto requirement incluya el projectRequestId
                              const requirementWithProjectId = {
                                ...requirement,
                                projectRequestId: data.id,
                              };
                              onManageSpecialties(
                                requirementWithProjectId as ProjectRequirement
                              );
                            }}
                            title="Gestionar especialidades"
                            className="h-8 px-2 flex items-center gap-1"
                          >
                            <Medal className="h-4 w-4" />
                            <span className="text-xs">Especialidades</span>
                          </Button>
                        )}
                        {onManageCertifications && (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              // Asegurarse de que el objeto requirement incluya el projectRequestId
                              const requirementWithProjectId = {
                                ...requirement,
                                projectRequestId: data.id,
                              };
                              onManageCertifications(
                                requirementWithProjectId as ProjectRequirement
                              );
                            }}
                            title="Gestionar certificaciones"
                            className="h-8 px-2 flex items-center gap-1"
                          >
                            <Award className="h-4 w-4" />
                            <span className="text-xs">Certificaciones</span>
                          </Button>
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
                                <div className="flex justify-between items-start mb-2">
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
                                  {participant.status && (
                                    <Badge
                                      className={`flex items-center space-x-1 border-0 pointer-events-none ${getStatusBadgeStyles(participant.status.id)}`}
                                    >
                                      {getStatusIcon(participant.status.id)}
                                      <span>{participant.status.name}</span>
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={() =>
                                      handleOpenLogsModal(
                                        participant,
                                        requirement.requirementName
                                      )
                                    }
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                    <span className="text-xs">Bitácora</span>
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
                                  {participant.status &&
                                    participant.status.id === 7 && (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                          onClick={() =>
                                            handleConfirmAction(
                                              participant,
                                              "approve"
                                            )
                                          }
                                          disabled={
                                            updatingStatus === participant.id
                                          }
                                        >
                                          {updatingStatus === participant.id &&
                                          confirmAction?.action ===
                                            "approve" ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Check className="h-3 w-3" />
                                          )}
                                          <span className="text-xs">
                                            Aprobar
                                          </span>
                                        </Button>

                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                          onClick={() =>
                                            handleConfirmAction(
                                              participant,
                                              "reject"
                                            )
                                          }
                                          disabled={
                                            updatingStatus === participant.id
                                          }
                                        >
                                          {updatingStatus === participant.id &&
                                          confirmAction?.action === "reject" ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <X className="h-3 w-3" />
                                          )}
                                          <span className="text-xs">
                                            Rechazar
                                          </span>
                                        </Button>
                                      </>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Información de Cotización</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            <span className="font-semibold">
                              Fecha de creación:
                            </span>{" "}
                            {formatDateForDisplay(
                              clientQuotationData.dateQuotationClient
                            )}
                          </span>
                        </div>
                        {clientQuotationData.dateQuotationSent && (
                          <div className="flex items-center space-x-2">
                            <Send className="h-4 w-4 text-purple-600" />
                            <span>
                              <span className="font-semibold">
                                Cotización enviada al Cliente:
                              </span>{" "}
                              {formatDateForDisplay(
                                clientQuotationData.dateQuotationSent
                              )}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <FileDigit className="h-4 w-4 text-muted-foreground" />
                          <span>
                            <span className="font-semibold">
                              Precio al Cliente:
                            </span>{" "}
                            {new Intl.NumberFormat("es-MX", {
                              style: "currency",
                              currency: "MXN",
                            }).format(clientQuotationData.clientPrice)}
                          </span>
                        </div>
                      </div>
                    </div>

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
                            <span>{clientQuotationData.quotationFileName}</span>
                          </Button>

                          {data.statusId === 10 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                              onClick={handleSendClientQuotation}
                              disabled={sendingClientQuotation}
                            >
                              {sendingClientQuotation ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                              <span>
                                {sendingClientQuotation
                                  ? "Enviando..."
                                  : "Enviar Cotización"}
                              </span>
                            </Button>
                          )}
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

      {/* Diálogo de confirmación para aprobar/rechazar cotización */}
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
              {confirmAction?.action === "approve" ? "Aprobar" : "Rechazar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación para enviar cotización */}
      <AlertDialog
        open={sendQuotationDialogOpen}
        onOpenChange={setSendQuotationDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-purple-600" />
              Enviar Cotización
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de enviar la cotización al cliente? Esto cambiará el
              estado del proyecto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSendQuotationDialogOpen(false);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSendQuotation}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de logs de seguimiento */}
      <ProjectRequestLogsModal
        isOpen={logsModalOpen}
        onClose={() => {
          setLogsModalOpen(false);
          setSelectedCompanyForLogs(null);
        }}
        projectRequestId={data.id}
        companyId={selectedCompanyForLogs?.id}
        requirementName={selectedCompanyForLogs?.requirementName}
        title={`Bitácora - ${selectedCompanyForLogs?.name || "Asociado"}`}
      />
    </>
  );
}
