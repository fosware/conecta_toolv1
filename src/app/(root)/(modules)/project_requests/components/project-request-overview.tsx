import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import { getToken } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ClipboardList,
  User,
  Building,
  FileText,
  Award,
  Medal,
  Users,
  Clock,
  CheckCircle2,
  FileSignature,
  HourglassIcon,
  CheckSquare,
  AlertCircle,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectRequestWithRelations } from "@/lib/schemas/project_request";

interface ProjectRequestOverviewProps {
  data: ProjectRequestWithRelations;
  onManageRequirements?: (item: ProjectRequestWithRelations) => void;
  onManageSpecialties?: (requirement: any) => void;
  onManageCertifications?: (requirement: any) => void;
  onManageParticipants?: (requirement: any) => void;
}

// Función para formatear fecha para mostrar
const formatDateForDisplay = (date: string | Date | null) => {
  if (!date) return "N/A";
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) throw new Error("Invalid date");

    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch (error) {
    console.error("Error formatting date:", date, error);
    return "Fecha inválida";
  }
};

// Función para obtener los estilos del badge según el estado
const getStatusBadgeStyles = (statusId: number) => {
  switch (statusId) {
    case 1: // Procesando
      return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case 2: // Asociado seleccionado
      return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case 3: // En espera de firma NDA
      return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    case 4: // Firmado por Asociado
      return "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
    case 5: // Espera de Documentos Técnicos
      return "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
    case 6: // Finalizado
      return "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    default:
      return "bg-gray-50 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300";
  }
};

// Función para obtener el icono según el estado
const getStatusIcon = (statusId: number) => {
  switch (statusId) {
    case 1: // Procesando
      return (
        <HourglassIcon className="w-3 h-3 text-blue-500 dark:text-blue-400 mr-1" />
      );
    case 2: // Asociado seleccionado
      return (
        <Users className="w-3 h-3 text-blue-500 dark:text-blue-400 mr-1" />
      );
    case 3: // En espera de firma NDA
      return (
        <FileSignature className="w-3 h-3 text-amber-500 dark:text-amber-400 mr-1" />
      );
    case 4: // Firmado por Asociado
      return (
        <CheckSquare className="w-3 h-3 text-purple-500 dark:text-purple-400 mr-1" />
      );
    case 5: // Espera de Documentos Técnicos
      return (
        <AlertCircle className="w-3 h-3 text-orange-500 dark:text-orange-400 mr-1" />
      );
    case 6: // Finalizado
      return (
        <CheckSquare className="w-3 h-3 text-green-500 dark:text-green-400 mr-1" />
      );
    default:
      return (
        <CheckCircle2 className="w-3 h-3 text-gray-500 dark:text-gray-400 mr-1" />
      );
  }
};

export function ProjectRequestOverview({ 
  data, 
  onManageRequirements,
  onManageSpecialties,
  onManageCertifications,
  onManageParticipants
}: ProjectRequestOverviewProps) {
  // Obtener los requerimientos si existen, filtrando los eliminados y asegurando que tengan projectRequestId
  const requirements = (data.ProjectRequirements || [])
    .filter((r: { isDeleted?: boolean }) => r.isDeleted !== true)
    .map((r: any) => ({
      ...r,
      projectRequestId: data.id // Aseguramos que cada requerimiento tenga el ID de la solicitud
    }));

  // Debug para ver la estructura de datos
  console.log("Requerimientos:", requirements);
  console.log(
    "Estructura completa de requerimientos:",
    JSON.stringify(requirements, null, 2)
  );

  // Ya no necesitamos cargar especialidades desde un endpoint separado
  // ya que ahora los requerimientos vienen directamente en la respuesta de la solicitud

  return (
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
            {requirements.length > 0 ? (
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
                          onClick={() => onManageSpecialties(requirement)}
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
                          onClick={() => onManageCertifications(requirement)}
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
                       ((requirement.RequirementSpecialty && requirement.RequirementSpecialty.length > 0) || 
                        (requirement.RequirementCertification && requirement.RequirementCertification.length > 0)) && (
                        <Button
                          variant="ghost"
                          onClick={() => onManageParticipants(requirement)}
                          title="Gestionar asociados"
                          className="h-6 px-2 flex items-center gap-1"
                        >
                          <Users className="h-3 w-3" />
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
                                <div>
                                  {participant.status && (
                                    <Badge
                                      className={`flex items-center space-x-1 border-0 pointer-events-none ${getStatusBadgeStyles(participant.status.id)}`}
                                    >
                                      {getStatusIcon(participant.status.id)}
                                      <span>{participant.status.name}</span>
                                    </Badge>
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
  );
}
