"use client";

import * as React from "react";
import {
  useState,
  useEffect,
  useCallback
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/table-skeleton";
import { Search, ChevronDown, ChevronRight, FileText, LayoutList, MessageSquare } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";
import { ProjectCategoriesModal } from "./components/project-categories-modal";
import ProjectOverview from "./components/project-overview";
import { ProjectLogsModal } from "@/app/(root)/(modules)/project_logs/components/project-logs-modal";
import UnreadIndicator from "@/app/(root)/(modules)/project_logs/components/unread-indicator";

// Definir interfaces para los tipos de datos
interface Company {
  id: number;
  companyName?: string;
  comercialName?: string;
  name?: string; // Para compatibilidad con diferentes respuestas API
}

interface ProjectRequest {
  id: number;
  title: string;
}

interface ProjectRequirement {
  id: number;
  ProjectRequest: ProjectRequest;
}

interface ProjectRequestCompany {
  id: number;
  Company?: Company;
  ProjectRequirements?: ProjectRequirement[];
  projectRequestId?: number;
}

interface ProjectStatus {
  id: number;
  name: string;
  color: string;
}

interface Project {
  id: number;
  projectRequestId: number;
  projectStatusId: number;
  projectRequestCompanyId: number;
  observations?: string;
  isDeleted: boolean;
  dateDeleted?: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
}

interface User {
  id: number;
  email: string;
  username: string;
}

interface ProjectWithRelations extends Project {
  user?: User;
  ProjectStatus?: ProjectStatus;
  ProjectRequestCompany?: ProjectRequestCompany;
  projectRequestTitle?: string; // Campo adicional que viene de la API enriquecida
}

// Función auxiliar para obtener el nombre de la compañía
const getCompanyName = (company?: Company) => {
  if (!company) return "Sin asociado";
  return company.comercialName || company.companyName || "Sin nombre";
};

// Función para obtener el título del proyecto
const getProjectTitle = (project: ProjectWithRelations) => {
  // Usar el nuevo campo projectRequestTitle que viene directamente de la API
  if (project.projectRequestTitle) {
    return project.projectRequestTitle;
  }

  // Fallback al método anterior por si acaso
  if (
    project.ProjectRequestCompany?.ProjectRequirements?.[0]?.ProjectRequest
      ?.title
  ) {
    return project.ProjectRequestCompany.ProjectRequirements[0].ProjectRequest
      .title;
  }

  return "Sin título";
};

export default function ProjectsPage() {
  const {
    role,
    loading: roleLoading,
    isStaff,
    isAsociado,
    refresh: refreshUserRole,
  } = useUserRole();

  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<ProjectWithRelations | null>(null);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [projectForLogs, setProjectForLogs] = useState<ProjectWithRelations | null>(null);
  
  // Función para refrescar el ProjectOverview
  const refreshProjectOverview = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  // Función para actualizar el estado de un proyecto en la lista cuando cambia su estado
  const handleProjectStatusChange = (projectId: number, progress: number, status: string) => {
    // Actualizar el estado del proyecto en la lista
    setProjects(prevProjects => {
      return prevProjects.map(project => {
        if (project.id === projectId) {
          // Determinar el nuevo projectStatusId basado en el estado
          let newStatusId = 1; // Por defecto: Por iniciar
          if (status === "Completado") {
            newStatusId = 3; // Completado
          } else if (status === "En progreso") {
            newStatusId = 2; // En progreso
          }
          
          // Crear un nuevo objeto ProjectStatus
          const newProjectStatus: ProjectStatus = {
            id: newStatusId,
            name: status,
            color: newStatusId === 3 ? "green" : newStatusId === 2 ? "blue" : "gray"
          };
          
          // Retornar el proyecto actualizado
          return {
            ...project,
            projectStatusId: newStatusId,
            ProjectStatus: newProjectStatus
          };
        }
        return project;
      });
    });
  };

  // Función para formatear fecha para mostrar en la tabla
  const formatDateForDisplay = (date: string | Date | null) => {
    if (!date) return "N/A";
    try {
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

  // Función para cargar los proyectos
  const fetchProjects = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) {
      setLoading(true);
    }
    try {
      const token = getToken();
      const response = await fetch(`/api/projects?active=${showActive}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Error HTTP:", response.status, response.statusText);
        throw new Error(
          `Error al cargar los proyectos: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Determinar la estructura correcta de los datos
      const projectsData = Array.isArray(data) ? data : data.projects || [];

      setProjects(projectsData);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Error al cargar los proyectos");
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  }, [showActive]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, showActive]);

  // Ya no necesitamos esta función porque el cambio de estado
  // se maneja directamente en el switch y el useEffect

  // No renderizamos un esqueleto separado, lo mostraremos dentro de la misma Card

  return (
    <>
      {/* Modal de Bitácora */}
      <ProjectLogsModal
        open={!!projectForLogs}
        onOpenChange={(isOpen: boolean) => {
          if (!isOpen) setProjectForLogs(null);
        }}
        projectId={projectForLogs?.id || 0}
        projectTitle={projectForLogs?.projectRequestTitle || "Proyecto"}
        categoryName={projectForLogs?.ProjectStatus?.name}
        associateName={projectForLogs?.ProjectRequestCompany?.Company?.companyName || ""}
        comercialName={projectForLogs?.ProjectRequestCompany?.Company?.comercialName || ""}
      />
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Proyectos</h1>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-active"
              checked={showActive}
              onCheckedChange={setShowActive}
            />
            <Label htmlFor="show-active">
              {showActive ? "Activos" : "Inactivos"}
            </Label>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Gestiona tus Proyectos</CardTitle>
                <CardDescription></CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center w-full">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar proyectos..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                    aria-label="Buscar por título, asociado o estado"
                    title="Buscar por título, asociado o estado"
                  />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <TableSkeleton columns={5} rows={5} />
                ) : projects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay proyectos {showActive ? "activos" : "inactivos"} para
                    mostrar.
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>Proyecto</TableHead>
                          <TableHead>Asociado</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha de Creación</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects
                          .filter((project) => {
                            if (!searchTerm.trim()) return true;

                            const searchTermLower = searchTerm
                              .toLowerCase()
                              .trim();

                            // Buscar en título del proyecto
                            const projectTitle = getProjectTitle(project);
                            if (
                              projectTitle.toLowerCase().includes(searchTermLower)
                            )
                              return true;

                            // Buscar en nombre del asociado
                            const companyName = getCompanyName(
                              project.ProjectRequestCompany?.Company
                            );
                            if (
                              companyName.toLowerCase().includes(searchTermLower)
                            )
                              return true;

                            // Buscar en estado del proyecto
                            if (
                              project.ProjectStatus?.name
                                .toLowerCase()
                                .includes(searchTermLower)
                            )
                              return true;

                            return false;
                          })
                          .map((project) => (
                            <React.Fragment key={project.id}>
                              <TableRow>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (expandedProjectId === project.id) {
                                        setExpandedProjectId(null);
                                      } else {
                                        setExpandedProjectId(project.id);
                                      }
                                    }}
                                    title={
                                      expandedProjectId === project.id
                                        ? "Contraer detalles"
                                        : "Expandir detalles"
                                    }
                                    className="hover:bg-muted flex items-center gap-1 h-8 px-2"
                                  >
                                    <FileText className="h-4 w-4" />
                                    {expandedProjectId === project.id ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableCell>
                                <TableCell>{getProjectTitle(project)}</TableCell>
                                <TableCell>
                                  {getCompanyName(
                                    project.ProjectRequestCompany?.Company
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={`px-2 py-1 rounded-md text-xs font-medium ${
                                      project.projectStatusId === 3
                                        ? "bg-green-100 text-green-700" // Completado
                                        : project.projectStatusId === 2
                                        ? "bg-blue-100 text-blue-700" // En progreso
                                        : "bg-slate-100 text-slate-700" // Por iniciar
                                    }`}
                                  >
                                    {project.ProjectStatus?.name || "Sin estado"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {formatDateForDisplay(project.createdAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setSelectedProject(project);
                                        setCategoriesModalOpen(true);
                                      }}
                                      title="Categorías"
                                    >
                                      <LayoutList className="h-4 w-4" />
                                    </Button>
                                    
                                    <div className="relative">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setProjectForLogs(project);
                                        }}
                                        title="Bitácora"
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                        <UnreadIndicator projectId={project.id} />
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                              {expandedProjectId === project.id && (
                                <TableRow>
                                  <TableCell colSpan={6} className="p-0 border-t-0">
                                    <div className="px-4 pb-4">
                                      <ProjectOverview
                                        projectId={project.id}
                                        projectTitle={getProjectTitle(project)}
                                        refreshKey={refreshKey}
                                        onProjectStatusChange={handleProjectStatusChange}
                                      />
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Modal de Categorías */}
      {selectedProject && (
        <ProjectCategoriesModal
          open={categoriesModalOpen}
          onOpenChange={setCategoriesModalOpen}
          projectId={selectedProject.id}
          projectTitle={getProjectTitle(selectedProject)}
          associateName={getCompanyName(selectedProject.ProjectRequestCompany?.Company)}
          onSuccess={() => {
            // Actualización optimista: refrescar los datos del proyecto expandido
            if (expandedProjectId === selectedProject.id) {
              // Forzar re-renderizado del componente ProjectOverview
              setExpandedProjectId(null);
              setTimeout(() => setExpandedProjectId(selectedProject.id), 10);
            }
          }}
        />
      )}
    </>
  );
}
