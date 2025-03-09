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
} from "lucide-react";
import { ProjectRequestWithRelations } from "@/lib/schemas/project_request";

interface ProjectRequestOverviewProps {
  data: ProjectRequestWithRelations;
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

export function ProjectRequestOverview({ data }: ProjectRequestOverviewProps) {
  // Obtener especialidades y certificaciones si existen, filtrando las eliminadas
  const specialties = (data.specialties || []).filter(s => s.isDeleted !== true);
  const certifications = (data.certifications || []).filter(c => c.isDeleted !== true);
  
  // Debug para ver la estructura de datos
  console.log('Certificaciones:', certifications);
  console.log('Especialidades:', specialties);
  console.log('Estructura completa de especialidades:', JSON.stringify(specialties, null, 2));
  
  // Función para cargar los detalles completos de las especialidades si es necesario
  const loadSpecialtiesDetails = async () => {
    if (!data.id) return;
    
    try {
      const response = await fetch(`/api/project_requests/${data.id}/specialties`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Error al cargar los detalles de las especialidades");
      }
      
      const responseData = await response.json();
      if (responseData.items && responseData.items.length > 0) {
        // Actualizar las especialidades con la información completa
        console.log('Especialidades cargadas desde API:', responseData.items);
      }
    } catch (error) {
      console.error("Error loading specialty details:", error);
    }
  };
  
  // Cargar los detalles de las especialidades cuando cambia el componente
  useEffect(() => {
    if (data.id) {
      loadSpecialtiesDetails();
    }
  }, [data.id]);

  return (
    <div className="p-6 bg-card rounded-lg shadow-lg mt-4 mb-6">
      <div className="flex flex-col space-y-6">
        {/* Fila 1: Título y Fecha */}
        <div className="flex flex-col items-center space-y-3">
          <h2 className="text-xl font-semibold text-center">{data.title}</h2>
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{formatDateForDisplay(data.requestDate || data.createdAt)}</span>
          </div>
        </div>

        {/* Fila 2: Cliente y Área */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-primary" />
            <span className="text-lg font-medium">Cliente: {data.clientArea?.client?.name || "No especificado"}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm pl-7">
            <span>Área: {data.clientArea?.areaName || "No especificada"}</span>
            {data.clientArea?.contactName && (
              <>
                <span className="mx-1">|</span>
                <span>Contacto: {data.clientArea.contactName}</span>
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
          <h3 className="text-lg font-medium flex items-center space-x-2">
            <ClipboardList className="w-5 h-5" />
            <span>Requerimientos</span>
          </h3>
          
          {/* Contenedor para Certificaciones y Especialidades con referencia visual */}
          <div className="border rounded-lg p-4 space-y-4">
            {/* Certificaciones */}
            <div>
              <h4 className="text-base font-medium flex items-center space-x-2">
                <Award className="w-4 h-4" />
                <span>Certificaciones ({certifications.length})</span>
              </h4>
              <div className="mt-2 space-y-2">
                {certifications.length > 0 ? (
                  certifications.map((certification: any, index: number) => (
                      <div key={index} className="text-sm space-y-1">
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4 text-primary" />
                          <span>
                            {certification.certification?.name || "ISO9002"}
                          </span>
                        </div>
                        {certification.observation && (
                          <div className="pl-6 text-muted-foreground">
                            <span>Observaciones: {certification.observation}</span>
                          </div>
                        )}
                      </div>
                  ))
                ) : (
                  <div className="flex items-center space-x-2 text-sm">
                    <Award className="w-4 h-4 text-primary" />
                    <span>Sin nombre de certificación</span>
                  </div>
                )}

              </div>
            </div>
            
            {/* Separador horizontal */}
            <div className="border-t my-2"></div>
            
            {/* Especialidades */}
            <div>
              <h4 className="text-base font-medium flex items-center space-x-2">
                <Medal className="w-4 h-4" />
                <span>Especialidades ({specialties.length})</span>
              </h4>
              <div className="mt-2 space-y-2">
                {specialties.length > 0 ? (
                  specialties.map((specialty: any, index: number) => (
                      <div key={index} className="text-sm space-y-2">
                        <div className="flex items-center space-x-2">
                          <Medal className="w-4 h-4 text-primary" />
                          <span className="font-medium">
                            {specialty.specialty?.name || "Herramientas de corte"}
                          </span>
                        </div>
                        {specialty.scope?.name && (
                          <div className="pl-6 flex items-center gap-1">
                            <span className="text-muted-foreground">Alcance:</span>
                            <span>{specialty.scope.name}</span>
                          </div>
                        )}
                        {specialty.subscope?.name && (
                          <div className="pl-6 flex items-center gap-1">
                            <span className="text-muted-foreground">Subalcance:</span>
                            <span>{specialty.subscope.name}</span>
                          </div>
                        )}
                        {specialty.observation && (
                          <div className="pl-6 text-muted-foreground">
                            <span>Observaciones: {specialty.observation}</span>
                          </div>
                        )}
                      </div>
                  ))
                ) : (
                  <div className="flex items-center space-x-2 text-sm">
                    <Medal className="w-4 h-4 text-primary" />
                    <span>Sin nombre de especialidad</span>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* Divisor */}
        <div className="border-t border-gray-200 my-2"></div>

        {/* Fila 5: Asociados seleccionados */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Asociados Seleccionados</span>
          </h3>
          
          {/* Contenedor para Asociados */}
          <div className="border rounded-lg p-4 space-y-4">
            {data.ProjectRequestCompany && data.ProjectRequestCompany.length > 0 ? (
              <div className="space-y-4">
                {data.ProjectRequestCompany.map((participant: any, index: number) => {
                  // Determinar el icono y colores según el estatus
                  let StatusIcon = CheckCircle2;
                  let badgeVariant = "";
                  let iconColor = "";
                  
                  if (participant.status) {
                    switch (participant.status.id) {
                      case 1: // Procesando
                        StatusIcon = HourglassIcon;
                        badgeVariant = "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
                        iconColor = "text-blue-500 dark:text-blue-400";
                        break;
                      case 2: // Asociado seleccionado
                        StatusIcon = Users;
                        badgeVariant = "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
                        iconColor = "text-blue-500 dark:text-blue-400";
                        break;
                      case 3: // En espera de firma NDA
                        StatusIcon = FileSignature;
                        badgeVariant = "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
                        iconColor = "text-amber-500 dark:text-amber-400";
                        break;
                      case 4: // Firmado por Asociado
                        StatusIcon = CheckSquare;
                        badgeVariant = "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
                        iconColor = "text-purple-500 dark:text-purple-400";
                        break;
                      case 5: // Espera de Documentos Técnicos
                        StatusIcon = AlertCircle;
                        badgeVariant = "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
                        iconColor = "text-orange-500 dark:text-orange-400";
                        break;
                      case 6: // Finalizado
                        StatusIcon = CheckSquare;
                        badgeVariant = "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300";
                        iconColor = "text-green-500 dark:text-green-400";
                        break;
                      default:
                        StatusIcon = CheckCircle2;
                        badgeVariant = "bg-gray-50 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300";
                        iconColor = "text-gray-500 dark:text-gray-400";
                    }
                  }
                  
                  return (
                    <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Building className="w-5 h-5 text-primary" />
                          <span className="font-medium">{participant.Company?.comercialName || "Empresa"}</span>
                        </div>
                        <Badge className={`flex items-center space-x-1 border-0 pointer-events-none ${badgeVariant}`}>
                          <StatusIcon className={`w-3 h-3 ${iconColor}`} />
                          <span>{participant.status?.name || "Sin estatus"}</span>
                        </Badge>
                      </div>
                      <div className="mt-2 pl-7 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {participant.Company?.contactName && (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span>Contacto: {participant.Company.contactName}</span>
                          </div>
                        )}
                        {participant.Company?.email && (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">Email:</span>
                            <span>{participant.Company.email}</span>
                          </div>
                        )}
                        {participant.Company?.phone && (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">Teléfono:</span>
                            <span>{participant.Company.phone}</span>
                          </div>
                        )}
                        {participant.ndaFile && (
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">NDA cargado</span>
                          </div>
                        )}
                        {participant.ndaSignedFile && (
                          <div className="flex items-center space-x-2">
                            <FileSignature className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">NDA firmado</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No hay asociados seleccionados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
