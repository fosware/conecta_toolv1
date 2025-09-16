"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
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
import {
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  LayoutList,
  MessageSquare,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useUserRole } from "@/hooks/use-user-role";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";
import ProjectOverview, {
  ProjectOverviewRef,
} from "./components/project-overview";
import { ProjectCategoriesModal } from "./components/project-categories-modal";
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
  realProgress?: number; // Campo adicional para almacenar el progreso real
}

// Nueva interfaz para proyectos agrupados (solo para admin)
interface GroupedProject {
  id: number; // projectRequestId
  projectRequestTitle: string;
  projectRequestId: number;
  asociados: ProjectWithRelations[];
  createdAt: Date;
  updatedAt: Date;
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

  // Determinar si es admin (role es un string según useUserRole)
  const isAdmin =
    role?.toLowerCase() === "admin" || role?.toLowerCase() === "gerente";

  // Estados que cambian según el rol
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [groupedProjects, setGroupedProjects] = useState<GroupedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedProject, setSelectedProject] =
    useState<ProjectWithRelations | null>(null);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [projectForLogs, setProjectForLogs] =
    useState<ProjectWithRelations | null>(null);

  // Ref para acceder al método de refresh del ProjectOverview
  const projectOverviewRef = useRef<ProjectOverviewRef>(null);

  // Map de refs para los ProjectOverview de asociados en vista agrupada
  const associatedProjectRefs = useRef<Map<number, ProjectOverviewRef>>(
    new Map()
  );

  // Función para obtener o crear ref de proyecto asociado
  const getAssociatedProjectRef = useCallback((projectId: number) => {
    return (ref: ProjectOverviewRef | null) => {
      if (ref) {
        associatedProjectRefs.current.set(projectId, ref);
      } else {
        associatedProjectRefs.current.delete(projectId);
      }
    };
  }, []);

  // Función para refrescar el ProjectOverview
  const refreshProjectOverview = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Función para actualizar el estado de un proyecto en la lista cuando cambia su estado
  const handleProjectStatusChange = useCallback(
    (projectId: number, progress: number, status: string) => {
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
        color:
          newStatusId === 3 ? "green" : newStatusId === 2 ? "blue" : "gray",
      };

      // Actualizar el estado del proyecto en la lista individual (para staff/asociado)
      setProjects((prevProjects) => {
        return prevProjects.map((project) => {
          if (project.id === projectId) {
            return {
              ...project,
              projectStatusId: newStatusId,
              ProjectStatus: newProjectStatus,
            };
          }
          return project;
        });
      });

      // Actualizar el estado del proyecto en la lista agrupada (para admin)
      setGroupedProjects((prevGroupedProjects) => {
        let hasChanges = false;

        const updatedGroups = prevGroupedProjects.map((groupedProject) => {
          // Verificar si este proyecto agrupado contiene el proyecto que cambió
          const projectToUpdate = groupedProject.asociados.find(
            (asociado) => asociado.id === projectId
          );

          if (projectToUpdate) {
            // Verificar si realmente hay un cambio de estado O progreso
            const statusChanged =
              projectToUpdate.projectStatusId !== newStatusId;
            const progressChanged = projectToUpdate.realProgress !== progress;

            if (!statusChanged && !progressChanged) {
              return groupedProject; // No hay cambio, retornar el mismo objeto
            }
            hasChanges = true;

            // Actualizar el asociado específico
            const updatedAsociados = groupedProject.asociados.map(
              (asociado) => {
                if (asociado.id === projectId) {
                  return {
                    ...asociado,
                    projectStatusId: newStatusId,
                    ProjectStatus: newProjectStatus,
                    realProgress: progress, // Almacenar el progreso real
                  };
                }
                return asociado;
              }
            );

            // Siempre retornar un nuevo objeto para forzar re-render
            return {
              ...groupedProject,
              asociados: updatedAsociados,
            };
          }

          return groupedProject;
        });

        // Solo actualizar el estado si hubo cambios reales
        if (hasChanges) {
          return updatedGroups;
        } else {
          return prevGroupedProjects;
        }
      });
    },
    []
  );

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
  const loadProjects = useCallback(
    async (showLoadingIndicator = true) => {
      try {
        if (showLoadingIndicator) {
          setLoading(true);
        }

        // Construir parámetros de consulta para paginación y búsqueda
        const params = new URLSearchParams({
          active: showActive.toString(),
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          search: searchTerm,
        });

        const response = await fetch(`/api/projects?${params}`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al cargar los proyectos");
        }

        const data = await response.json();

        // Manejar datos según el rol
        if (isAdmin) {
          // Para admin: datos agrupados
          const groupedWithProgress = (data.items || []).map(
            (group: GroupedProject) => ({
              ...group,
              asociados: group.asociados.map((asociado) => ({
                ...asociado,
                realProgress:
                  asociado.realProgress ??
                  (asociado.projectStatusId === 3
                    ? 100 // Completado
                    : asociado.projectStatusId === 2
                      ? 50 // En progreso
                      : 0), // Por iniciar
              })),
            })
          );
          setGroupedProjects(groupedWithProgress);
          setProjects([]); // Limpiar proyectos individuales
        } else {
          // Para asociado/staff: datos individuales
          setProjects(data.items || []);
          setGroupedProjects([]); // Limpiar proyectos agrupados
        }

        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
      } catch (error) {
        console.error("Error loading projects:", error);
        toast.error("Error al cargar los proyectos");
      } finally {
        setLoading(false);
      }
    },
    [showActive, currentPage, itemsPerPage, searchTerm, isAdmin, role]
  );

  useEffect(() => {
    // Solo cargar proyectos cuando el rol esté disponible
    if (!roleLoading && role) {
      loadProjects();
    }
  }, [loadProjects, roleLoading, role]);

  // Manejador para cambiar la cantidad de elementos por página
  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Resetear a la primera página cuando cambia el tamaño
  };

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
        associateName={
          projectForLogs?.ProjectRequestCompany?.Company?.companyName || ""
        }
        comercialName={
          projectForLogs?.ProjectRequestCompany?.Company?.comercialName || ""
        }
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
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="relative flex-grow flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Buscar proyectos..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1); // Resetear a la primera página al buscar
                    }}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label htmlFor="itemsPerPage" className="mr-2">
                    Mostrar:
                  </label>
                  <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    className="border rounded-md p-1"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <TableSkeleton columns={5} rows={5} />
                ) : (
                    isAdmin
                      ? groupedProjects.length === 0
                      : projects.length === 0
                  ) ? (
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
                          <TableHead className={isAdmin ? "w-[280px]" : ""}>
                            Proyecto
                          </TableHead>
                          {isAdmin ? (
                            // Header para ADMIN
                            <>
                              <TableHead className="w-[320px]">
                                Progreso General
                              </TableHead>
                              <TableHead className="w-[160px]">
                                Fecha de Creación
                              </TableHead>
                              <TableHead className="text-center w-[100px]">
                                Asociados
                              </TableHead>
                            </>
                          ) : (
                            // Header para ASOCIADO/STAFF
                            <>
                              <TableHead>Asociado</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Fecha de Creación</TableHead>
                              <TableHead className="text-right">
                                Acciones
                              </TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isAdmin
                          ? // RENDERIZADO PARA ADMIN: Proyectos agrupados
                            groupedProjects.map((groupedProject) => (
                              <React.Fragment key={groupedProject.id}>
                                <TableRow>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (
                                          expandedProjectId ===
                                          groupedProject.id
                                        ) {
                                          setExpandedProjectId(null);
                                        } else {
                                          setExpandedProjectId(
                                            groupedProject.id
                                          );
                                        }
                                      }}
                                      title={
                                        expandedProjectId === groupedProject.id
                                          ? "Contraer detalles"
                                          : "Expandir detalles"
                                      }
                                      className="hover:bg-muted flex items-center gap-1 h-8 px-2"
                                    >
                                      <FileText className="h-4 w-4" />
                                      {expandedProjectId ===
                                      groupedProject.id ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {groupedProject.projectRequestTitle}
                                  </TableCell>
                                  <TableCell>
                                    {(() => {
                                      // Calcular progreso general promediando todos los asociados
                                      const totalAsociados =
                                        groupedProject.asociados.length;

                                      if (totalAsociados === 0) return null;

                                      const totalProgress =
                                        groupedProject.asociados.reduce(
                                          (acc, asociado) => {
                                            // Si no tiene realProgress, usar valor por defecto basado en estado
                                            const progress =
                                              asociado.realProgress ??
                                              (asociado.projectStatusId === 3
                                                ? 100 // Completado
                                                : asociado.projectStatusId === 2
                                                  ? 50 // En progreso
                                                  : 0); // Por iniciar
                                            return acc + progress;
                                          },
                                          0
                                        );

                                      const progresoPromedio = Math.round(
                                        totalProgress / totalAsociados
                                      );

                                      return (
                                        <div className="flex items-center">
                                          <div className="flex items-center gap-3 w-[200px]">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[140px]">
                                              <div
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                style={{
                                                  width: `${progresoPromedio}%`,
                                                }}
                                              ></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 min-w-[35px] text-right">
                                              {progresoPromedio}%
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </TableCell>
                                  <TableCell>
                                    {formatDateForDisplay(
                                      groupedProject.createdAt
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="text-sm font-medium text-gray-700">
                                      {groupedProject.asociados.length}
                                    </span>
                                  </TableCell>
                                </TableRow>
                                {expandedProjectId === groupedProject.id && (
                                  <TableRow>
                                    <TableCell colSpan={5} className="p-0">
                                      <div className="bg-muted/50 p-6 space-y-6">
                                        <h2 className="text-xl font-bold text-center mb-6">
                                          {groupedProject.projectRequestTitle}
                                        </h2>
                                        {groupedProject.asociados.map(
                                          (asociado) => (
                                            <div
                                              key={asociado.id}
                                              className="border rounded-lg p-4 bg-background"
                                            >
                                              <div className="mb-4 flex items-center justify-between">
                                                <h3 className="text-lg font-semibold">
                                                  {getCompanyName(
                                                    asociado
                                                      .ProjectRequestCompany
                                                      ?.Company
                                                  )}
                                                </h3>
                                                <div className="flex gap-2">
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                      setSelectedProject(
                                                        asociado
                                                      );
                                                      setCategoriesModalOpen(
                                                        true
                                                      );
                                                    }}
                                                    title="Gestionar categorías"
                                                    className="h-8 px-2"
                                                  >
                                                    <LayoutList className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                      setProjectForLogs(
                                                        asociado
                                                      )
                                                    }
                                                    title="Ver bitácora"
                                                    className="h-8 px-2 relative"
                                                  >
                                                    <MessageSquare className="h-4 w-4" />
                                                    <UnreadIndicator
                                                      projectId={asociado.id}
                                                    />
                                                  </Button>
                                                </div>
                                              </div>
                                              <ProjectOverview
                                                ref={getAssociatedProjectRef(
                                                  asociado.id
                                                )}
                                                key={`${asociado.id}-${refreshKey}`}
                                                projectId={asociado.id}
                                                projectTitle="" // Título vacío para evitar repetición
                                                refreshKey={refreshKey}
                                                onProjectStatusChange={
                                                  handleProjectStatusChange
                                                }
                                              />
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            ))
                          : // RENDERIZADO ORIGINAL PARA ASOCIADO/STAFF: Proyectos individuales
                            projects
                              .filter((project) => {
                                if (!searchTerm.trim()) return true;

                                const searchTermLower = searchTerm
                                  .toLowerCase()
                                  .trim();

                                // Buscar en título del proyecto
                                const projectTitle = getProjectTitle(project);
                                if (
                                  projectTitle
                                    .toLowerCase()
                                    .includes(searchTermLower)
                                )
                                  return true;

                                // Buscar en nombre del asociado
                                const companyName = getCompanyName(
                                  project.ProjectRequestCompany?.Company
                                );
                                if (
                                  companyName
                                    .toLowerCase()
                                    .includes(searchTermLower)
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
                                          if (
                                            expandedProjectId === project.id
                                          ) {
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
                                    <TableCell>
                                      {getProjectTitle(project)}
                                    </TableCell>
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
                                        {project.ProjectStatus?.name ||
                                          "Sin estado"}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      {formatDateForDisplay(project.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedProject(project);
                                            setCategoriesModalOpen(true);
                                          }}
                                          title="Gestionar categorías"
                                          className="h-8 px-2"
                                        >
                                          <LayoutList className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            setProjectForLogs(project)
                                          }
                                          title="Ver bitácora"
                                          className="h-8 px-2 relative"
                                        >
                                          <MessageSquare className="h-4 w-4" />
                                          <UnreadIndicator
                                            projectId={project.id}
                                          />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                  {expandedProjectId === project.id && (
                                    <TableRow>
                                      <TableCell colSpan={6} className="p-0">
                                        <div className="bg-muted/50 p-6">
                                          <ProjectOverview
                                            ref={
                                              expandedProjectId === project.id
                                                ? projectOverviewRef
                                                : null
                                            }
                                            key={`${project.id}-${refreshKey}`}
                                            projectId={project.id}
                                            projectTitle={getProjectTitle(
                                              project
                                            )}
                                            refreshKey={refreshKey}
                                            onProjectStatusChange={
                                              handleProjectStatusChange
                                            }
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

                {/* Componente de paginación */}
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
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
          requirementName={
            // Para Admin: ProjectRequirements es objeto directo
            (selectedProject.ProjectRequestCompany?.ProjectRequirements as { requirementName?: string })?.requirementName ||
            // Para Asociado: ProjectRequirements es array
            (selectedProject.ProjectRequestCompany?.ProjectRequirements as { requirementName?: string }[])?.[0]?.requirementName
          }
          associateName={getCompanyName(selectedProject.ProjectRequestCompany?.Company)}
          onSuccess={async () => {
            // Refrescar las categorías del proyecto sin parpadeo

            // Primero intentar con el ref del proyecto asociado (vista agrupada)
            const associatedRef = associatedProjectRefs.current.get(
              selectedProject.id
            );

            if (associatedRef) {
              // Caso 1: Usar ref del proyecto asociado en vista agrupada
              try {
                await associatedRef.refreshCategories();
                return; // Salir temprano, ya se refrescó
              } catch (error) {
                console.error("Error al refrescar proyecto asociado:", error);
              }
            }

            if (
              expandedProjectId === selectedProject.id &&
              projectOverviewRef.current
            ) {
              // Caso 2: Usar ref del proyecto expandido individualmente
              try {
                await projectOverviewRef.current.refreshCategories();
              } catch (error) {
                console.error("Error al refrescar proyecto expandido:", error);
                // Fallback: usar el método anterior solo si falla
                setExpandedProjectId(null);
                setTimeout(() => setExpandedProjectId(selectedProject.id), 10);
              }
            } else if (expandedProjectId !== null) {
              // Caso 3: Si hay un proyecto expandido pero no es el del modal, expandir el correcto
              setExpandedProjectId(selectedProject.id);
            }
          }}
        />
      )}
    </>
  );
}
