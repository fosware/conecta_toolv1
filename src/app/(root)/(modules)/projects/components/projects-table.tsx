"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/table-skeleton";
import { toast } from "sonner";
import {
  Search,
  Eye,
  ChevronRight,
  ChevronDown,
  FileText,
  Loader2,
  Building2,
  ListChecks,
  MessageSquare,
} from "lucide-react";
import { Input } from "@/components/ui/input";

import { ProjectWithRelations } from "@/lib/schemas/project";
import { ProjectLogsModal } from "@/app/(root)/(modules)/project_logs/components/project-logs-modal";
import UnreadIndicator from "@/app/(root)/(modules)/project_logs/components/unread-indicator";

type Project = ProjectWithRelations;

// Función para formatear fecha para mostrar en la tabla
const formatDateForDisplay = (date: string | Date | null) => {
  if (!date) return "N/A";
  try {
    // Si la fecha ya es un objeto Date, usarlo directamente
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) throw new Error("Invalid date");

    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC", // Forzar interpretación UTC
    });
  } catch (error) {
    console.error("Error formatting date:", date, error);
    return "Fecha inválida";
  }
};

interface ProjectsTableProps {
  data: Project[];
  isLoading?: boolean;
  isStaff?: boolean;
  onRowClick?: (project: Project) => void;
  onViewDetails?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onOpenLogs?: (project: Project) => void;
}

export function ProjectsTable({
  data,
  isLoading = false,
  isStaff = false,
  onRowClick,
  onViewDetails,
  onEdit,
  onOpenLogs,
}: ProjectsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedProjectDetails, setSelectedProjectDetails] = useState<Project | null>(null);
  const [projectForLogs, setProjectForLogs] = useState<Project | null>(null);

  // Tabla de ejemplo con datos ficticios si no se proporcionan datos
  const mockData: Project[] = [
    {
      id: 1,
      projectRequestId: 1,
      projectStatusId: 1,
      projectRequestCompanyId: 1,
      observations: "Proyecto de ejemplo",
      isDeleted: false,
      dateDeleted: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 1,
      user: {
        id: 1,
        name: "Usuario Ejemplo",
        email: "usuario@ejemplo.com",
      },
      ProjectStatus: {
        id: 1,
        name: "En Proceso",
        color: "#3498db",
      },
      ProjectRequestCompany: {
        id: 1,
        companyId: 1,
        Company: {
          id: 1,
          name: "Empresa Ejemplo",
          logo: null,
        },
      },
    },
  ];

  // Usar datos proporcionados o datos de ejemplo
  const tableData = data && data.length > 0 ? data : mockData;

  // Filtrar datos según el término de búsqueda
  const filteredData = tableData.filter((item) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      item.ProjectRequestCompany.Company.name.toLowerCase().includes(searchTermLower) ||
      item.ProjectStatus.name.toLowerCase().includes(searchTermLower) ||
      (item.observations && item.observations.toLowerCase().includes(searchTermLower))
    );
  });

  // Renderizar esqueleto de carga si está cargando
  if (isLoading) {
    return <TableSkeleton columns={6} rows={5} />;
  }

  return (
    <div className="space-y-4">
      {/* Modal de bitácora */}
      <ProjectLogsModal
        open={!!projectForLogs}
        onOpenChange={(isOpen: boolean) => {
          if (!isOpen) setProjectForLogs(null);
        }}
        projectId={projectForLogs?.id || 0}
        projectTitle={projectForLogs?.ProjectRequestCompany?.Company?.name || "Proyecto"}
      />
      
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proyectos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Asociado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Creación</TableHead>
              <TableHead>Observaciones</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron proyectos.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <React.Fragment key={item.id}>
                  <TableRow
                    className={
                      expandedId === item.id
                        ? "bg-muted/50 cursor-pointer"
                        : "cursor-pointer hover:bg-muted/50"
                    }
                    onClick={() => onRowClick && onRowClick(item)}
                  >
                    <TableCell>
                      {expandedId === item.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {item.ProjectRequestCompany.Company.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        style={{
                          backgroundColor: item.ProjectStatus.color || undefined,
                        }}
                      >
                        {item.ProjectStatus.name}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateForDisplay(item.createdAt)}</TableCell>
                    <TableCell>
                      {item.observations ? (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">
                            {item.observations}
                          </span>
                        </div>
                      ) : (
                        "Sin observaciones"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails && onViewDetails(item);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectForLogs(item);
                            }}
                          >
                            <MessageSquare className="h-4 w-4" />
                            <UnreadIndicator projectId={item.id} />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedId === item.id && selectedProjectDetails && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0 border-t-0">
                        <div className="px-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h3 className="text-lg font-semibold mb-2">
                                Detalles del Proyecto
                              </h3>
                              <div className="space-y-2">
                                <div>
                                  <span className="font-medium">Asociado:</span>{" "}
                                  {selectedProjectDetails.ProjectRequestCompany.Company.name}
                                </div>
                                <div>
                                  <span className="font-medium">Estado:</span>{" "}
                                  <Badge
                                    style={{
                                      backgroundColor:
                                        selectedProjectDetails.ProjectStatus.color || undefined,
                                    }}
                                  >
                                    {selectedProjectDetails.ProjectStatus.name}
                                  </Badge>
                                </div>
                                <div>
                                  <span className="font-medium">Fecha de Creación:</span>{" "}
                                  {formatDateForDisplay(selectedProjectDetails.createdAt)}
                                </div>
                                <div>
                                  <span className="font-medium">Última Actualización:</span>{" "}
                                  {formatDateForDisplay(selectedProjectDetails.updatedAt)}
                                </div>
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold mb-2">
                                Observaciones
                              </h3>
                              <div className="p-3 bg-background rounded-md border min-h-[100px]">
                                {selectedProjectDetails.observations || "Sin observaciones"}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                onRowClick && onRowClick(selectedProjectDetails);
                              }}
                            >
                              Cerrar Detalles
                            </Button>
                            {isStaff && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  onEdit && onEdit(selectedProjectDetails);
                                }}
                              >
                                Editar Proyecto
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
