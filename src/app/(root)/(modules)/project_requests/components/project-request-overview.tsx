import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  Calendar,
  FileText,
  ClipboardList,
  Medal,
  Award,
  Users,
  CheckSquare,
  AlertCircle,
  ListChecks,
  File,
  Download,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectRequestWithRelations } from "@/lib/schemas/project_request";
import { TechnicalDocumentsDialog } from "./technical-documents-dialog";
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

interface ProjectRequestOverviewProps {
  data: ProjectRequestWithRelations;
  onManageRequirements?: (data: ProjectRequestWithRelations) => void;
  onManageSpecialties?: (requirement: any) => void;
  onManageCertifications?: (requirement: any) => void;
  onManageParticipants?: (requirement: any) => void;
  onRefreshData?: () => void; // Nuevo prop para refrescar los datos
}

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
    case 9: // Cotización aprobada
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
    action: 'approve' | 'reject';
    title: string;
    description: string;
  } | null>(null);

  // Estado para el modal de documentos técnicos
  const [technicalDocsOpen, setTechnicalDocsOpen] = useState(false);

  // Depuración: Imprimir los datos recibidos para verificar su estructura
  useEffect(() => {
    console.log("ProjectRequestOverview - Datos recibidos:", data);
    console.log("ProjectRequirements:", data.ProjectRequirements);
  }, [data]);

  // Obtener los requerimientos si existen, filtrando solo los eliminados
  const requirements = (data.ProjectRequirements || [])
    .filter((r: { isDeleted?: boolean }) => r.isDeleted !== true);

  // Depuración: Verificar los requerimientos filtrados
  useEffect(() => {
    console.log("Requerimientos filtrados:", requirements);
  }, [requirements]);

  // Ya no necesitamos cargar especialidades desde un endpoint separado
  // ya que ahora los requerimientos vienen directamente en la respuesta de la solicitud

  // Función para abrir el modal de documentos técnicos
  const handleOpenTechnicalDocs = (participant: any, requirementId: number) => {
    console.log("Abriendo documentos técnicos para:", participant);
    
    // Verificar que participant.Company existe y tiene un ID
    if (!participant.Company || !participant.Company.id) {
      console.error("Error: No se encontró el ID de la compañía", participant);
      return;
    }
    
    setSelectedCompany({
      id: participant.Company.id, // Usar el ID de la compañía, no el ID del participante
      requirementId,
      name: participant.Company?.comercialName || "Empresa sin nombre"
    });
    setTechnicalDocsOpen(true);
  };

  // Función para refrescar los datos cuando se cierra el diálogo de documentos técnicos
  const handleRefreshData = () => {
    if (onRefreshData) {
      onRefreshData();
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
      const fileName = quoteInfo.quotationFileName || `cotizacion-${participant.id}.xlsx`;

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

  const handleConfirmAction = (participant: any, action: 'approve' | 'reject') => {
    // Preparar el diálogo de confirmación según la acción
    if (action === 'approve') {
      setConfirmAction({
        participantId: participant.id,
        action: 'approve',
        title: "Aprobar cotización",
        description: `¿Está seguro que desea aprobar la cotización de ${participant.Company?.comercialName || "la empresa seleccionada"}?`
      });
    } else {
      setConfirmAction({
        participantId: participant.id,
        action: 'reject',
        title: "Rechazar cotización",
        description: `¿Está seguro que desea rechazar la cotización de ${participant.Company?.comercialName || "la empresa seleccionada"}?`
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
      const newStatusId = confirmAction.action === 'approve' ? 9 : 8; // 9: Cotización aprobada, 8: Cotización rechazada
      
      // Llamar a la API para actualizar el estado
      const response = await fetch(`/api/assigned_companies/${confirmAction.participantId}/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statusId: newStatusId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error al ${confirmAction.action === 'approve' ? 'aprobar' : 'rechazar'} la cotización`);
      }
      
      // Mostrar mensaje de éxito
      toast.success(`Cotización ${confirmAction.action === 'approve' ? 'aprobada' : 'rechazada'} correctamente`);
      
      // Refrescar los datos sin mostrar el indicador de carga
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      console.error("Error updating quotation status:", error);
      toast.error(`Error al ${confirmAction.action === 'approve' ? 'aprobar' : 'rechazar'} la cotización`);
    } finally {
      setUpdatingStatus(null);
      setConfirmDialogOpen(false);
      setConfirmAction(null);
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
                Cliente: {data.clientArea?.client?.name || "No especificado"}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm pl-7">
              <span>Área: {data.clientArea?.areaName || "No especificada"}</span>
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
                <p className="text-muted-foreground italic">Sin observaciones</p>
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
                      <div className="flex items-center space-x-2">
                        <ClipboardList className="w-5 h-5 text-primary" />
                        <h4 className="text-base font-medium">
                          {requirement.requirementName}
                        </h4>
                      </div>
                      <div className="flex space-x-1">
                        {onManageSpecialties && (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              // Asegurarse de que el objeto requirement incluya el projectRequestId
                              const requirementWithProjectId = {
                                ...requirement,
                                projectRequestId: data.id
                              };
                              onManageSpecialties(requirementWithProjectId);
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
                                projectRequestId: data.id
                              };
                              onManageCertifications(requirementWithProjectId);
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
                        Especialidades
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
                                  <span> | Subalcance: {spec.subscope.name}</span>
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
                        Certificaciones
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
                          Asociados seleccionados
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
                                projectRequestId: data.id
                              };
                              onManageParticipants(requirementWithProjectId);
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
                                className="border rounded p-2 text-sm"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">
                                      {participant.Company?.comercialName ||
                                        "Empresa sin nombre"}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      <div>
                                        {participant.Company?.contactName ||
                                          "Sin contacto"}
                                      </div>
                                      <div>
                                        {participant.Company?.email ||
                                          "Sin correo"}
                                      </div>
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
                                    {/* Botón de Documentos Técnicos para asociados que han firmado el NDA o están en espera/con documentos técnicos */}
                                    {participant.status &&
                                      (participant.status.id === 4 || participant.status.id === 5 || participant.status.id === 6) && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-1 mt-1"
                                          onClick={() =>
                                            handleOpenTechnicalDocs(
                                              participant,
                                              requirement.id
                                            )
                                          }
                                        >
                                          <File className="h-3 w-3" />
                                          <span className="text-xs">
                                            Documentos técnicos
                                          </span>
                                        </Button>
                                      )}
                                    {/* Botón para descargar cotización cuando el estado es "Cotización enviada", "Cotización rechazada" o "Cotización aprobada" */}
                                    {participant.status && [7, 8, 9].includes(participant.status.id) && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-1 mt-1"
                                        onClick={() => handleDownloadQuote(participant)}
                                        disabled={downloadingQuote === participant.id}
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
                                    {/* Botones para aprobar o rechazar cotización cuando el estado es "Cotización enviada" */}
                                    {participant.status && participant.status.id === 7 && (
                                      <div className="flex flex-row gap-2 mt-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                          onClick={() => handleConfirmAction(participant, 'approve')}
                                          disabled={updatingStatus === participant.id}
                                        >
                                          {updatingStatus === participant.id && confirmAction?.action === 'approve' ? (
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
                                          onClick={() => handleConfirmAction(participant, 'reject')}
                                          disabled={updatingStatus === participant.id}
                                        >
                                          {updatingStatus === participant.id && confirmAction?.action === 'reject' ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <X className="h-3 w-3" />
                                          )}
                                          <span className="text-xs">
                                            Rechazar
                                          </span>
                                        </Button>
                                      </div>
                                    )}
                                  </div>
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

          {/* Fin de los requerimientos */}
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
            <AlertDialogAction
              onClick={handleUpdateQuotationStatus}
            >
              {confirmAction?.action === 'approve' ? 'Aprobar' : 'Rechazar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
