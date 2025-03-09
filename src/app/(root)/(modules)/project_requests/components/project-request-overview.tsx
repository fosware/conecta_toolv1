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
      </div>
    </div>
  );
}
