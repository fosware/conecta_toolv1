"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";
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
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useUserRole } from "@/hooks/use-user-role";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";
import { ProjectManagementOverview } from "./components/project-management-overview";
import { ProjectStagesModal } from "./components/project-stages-modal";

// Definir interfaces para los tipos de datos
interface Company {
  id: number;
  companyName?: string;
  comercialName?: string;
  name?: string;
}

interface ProjectRequest {
  id: number;
  title: string;
}

interface ProjectRequirement {
  id: number;
  description?: string;
  ProjectRequest?: ProjectRequest;
  ProjectRequestCompany?: ProjectRequestCompany[];
}

interface ProjectRequestCompany {
  id: number;
  Company?: Company;
  Project?: ProjectManagement[];
}

interface ProjectStatus {
  id: number;
  name: string;
  color: string;
}

interface ProjectManagement {
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

interface ProjectManagementWithRelations extends ProjectManagement {
  user?: User;
  ProjectStatus?: ProjectStatus;
  ProjectRequestCompany?: ProjectRequestCompany;
  ProjectRequirements?: ProjectRequirement[];
  projectRequestTitle?: string;
  // Nuevas fechas basadas en actividades
  projectStartDate?: Date | null;
  projectEndDate?: Date | null;
}



// Función para obtener el título del proyecto (ahora es el título de la solicitud)
const getProjectTitle = (project: ProjectManagementWithRelations) => {
  // El título ahora viene directamente de projectRequestTitle
  return project.projectRequestTitle || "Sin título";
};

export default function ProjectManagementPage() {
  const {
    role,
    loading: roleLoading,
    isStaff,
    isAsociado,
    refresh: refreshUserRole,
  } = useUserRole();

  const [projects, setProjects] = useState<ProjectManagementWithRelations[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // ✅ 300ms para homogeneidad

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedProject, setSelectedProject] =
    useState<ProjectManagementWithRelations | null>(null);
  const [stagesModalOpen, setStagesModalOpen] = useState(false);
  
  // Estado para almacenar el progreso de cada proyecto
  const [projectProgress, setProjectProgress] = useState<Record<number, {status: string, progress: number}>>({});
  
  // Ref para evitar llamadas duplicadas en mount inicial
  const isInitialMount = useRef(true);
  
  // Ref para prevenir múltiples llamadas simultáneas
  const isLoadingRef = useRef(false);

  // Función para actualizar el estado del proyecto basado en el progreso
  const updateProjectStatus = useCallback((projectId: number, status: string, progress: number) => {
    // Actualizar el estado de progreso
    setProjectProgress(prev => ({
      ...prev,
      [projectId]: { status, progress }
    }));
    
    setProjects(prevProjects => 
      prevProjects.map(project => {
        if (project.id === projectId) {
          // Mapear el estado calculado a los IDs de estado de la base de datos
          let projectStatusId = project.projectStatusId;
          let statusName = status;
          
          // Aquí puedes mapear los estados según tu base de datos
          // Por ejemplo: "Por iniciar" = 1, "En progreso" = 2, "Completado" = 3
          if (status === "Por iniciar") {
            projectStatusId = 1;
          } else if (status === "En progreso") {
            projectStatusId = 2;
          } else if (status === "Completado") {
            projectStatusId = 3;
          }
          
          return {
            ...project,
            projectStatusId,
            ProjectStatus: {
              id: projectStatusId,
              name: statusName,
              color: project.ProjectStatus?.color || ""
            }
          } as ProjectManagementWithRelations;
        }
        return project;
      })
    );
  }, []);

  // Función para obtener el texto de avance general
  const getProjectProgressText = (project: ProjectManagementWithRelations) => {
    const progress = projectProgress[project.id];
    if (!progress) {
      return "No definido";
    }
    return `${progress.status} ${progress.progress}%`;
  };

  // Función para obtener la clase del badge de avance
  const getProgressBadgeClass = (project: ProjectManagementWithRelations) => {
    const progress = projectProgress[project.id];
    if (!progress) {
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
    
    if (progress.status === "Completado") {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    } else if (progress.status === "En progreso") {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    } else {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    }
  };

  // Función para refrescar el ProjectManagementOverview
  const refreshProjectOverview = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Función para actualizar el estado de un proyecto en la lista cuando cambia su estado
  const handleProjectStatusChange = useCallback(
    (projectId: number, progress: number, status: string) => {
      setProjects((prevProjects) =>
        prevProjects.map((project) => {
          if (project.id === projectId) {
            return {
              ...project,
              ProjectStatus: {
                ...project.ProjectStatus!,
                name: status,
              },
            };
          }
          return project;
        })
      );
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
        timeZone: "UTC",
      });
    } catch (error) {
      console.error("Error formatting date:", date, error);
      return "Fecha inválida";
    }
  };

  // Función para cargar proyectos - optimizada con useCallback
  const loadProjects = useCallback(
    async (showLoading = true) => {
      // OPTIMIZACIÓN: Prevenir múltiples llamadas simultáneas
      if (isLoadingRef.current) {
        return;
      }
      
      isLoadingRef.current = true;
      if (showLoading) setLoading(true);

      try {
        const token = getToken();
        if (!token) {
          isLoadingRef.current = false;
          toast.error("No se encontró token de autenticación");
          return;
        }

        const statusFilter = showActive ? "active" : "all";
        const response = await fetch(
          `/api/project_management?page=${currentPage}&limit=${itemsPerPage}&status=${statusFilter}&search=${encodeURIComponent(debouncedSearchTerm)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Error al cargar proyectos");
        }

        const data = await response.json();
        const projects = data.projects || [];
        setProjects(projects);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || 0);
        
        // OPTIMIZACIÓN: Usar progreso pre-calculado del backend
        if (projects.length > 0) {
          const progressData: Record<number, {status: string, progress: number}> = {};
          projects.forEach((project: any) => {
            if (project.calculatedProgress !== undefined && project.calculatedStatus) {
              progressData[project.id] = {
                status: project.calculatedStatus,
                progress: project.calculatedProgress
              };
            } else {
              // Fallback si no viene calculado
              progressData[project.id] = { status: 'Por iniciar', progress: 0 };
            }
          });
          setProjectProgress(progressData);
        }
      } catch (error) {
        console.error("Error loading projects:", error);
        toast.error("Error al cargar los proyectos");
        // Datos de ejemplo para desarrollo
        setProjects([
          {
            id: 1,
            projectRequestId: 1,
            projectStatusId: 2,
            projectRequestCompanyId: 1,
            observations: "Proyecto de ejemplo en desarrollo",
            isDeleted: false,
            dateDeleted: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: 1,
            projectRequestTitle: "Proyecto A - Cliente Alpha",
            ProjectStatus: {
              id: 2,
              name: "En Progreso",
              color: "#3498db",
            },
            ProjectRequestCompany: {
              id: 1,
              Company: {
                id: 1,
                companyName: "Qu4tro SI",
                comercialName: "Qu4tro SI",
              },
            },
          },
        ]);
      } finally {
        isLoadingRef.current = false;
        if (showLoading) setLoading(false);
      }
    },
    [currentPage, itemsPerPage, showActive, debouncedSearchTerm] // ✅ Usar debouncedSearchTerm
  );

  // Manejador para cambiar la cantidad de elementos por página
  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Cargar proyectos al montar el componente o cuando cambien las dependencias específicas
  useEffect(() => {
    loadProjects();
  }, [currentPage, itemsPerPage, showActive]); // ✅ Carga inicial y cambios de filtros

  // Efecto separado para búsquedas - sin mostrar loading para evitar parpadeo
  useEffect(() => {
    // OPTIMIZACIÓN: Evitar ejecución en mount inicial (ya se ejecuta el primer useEffect)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (debouncedSearchTerm !== undefined) {
      loadProjects(false); // ✅ Sin loading indicator para evitar parpadeo
    }
  }, [debouncedSearchTerm]); // ✅ Solo cuando cambie la búsqueda

// Función para alternar la expansión de un proyecto
const toggleProjectExpansion = (projectId: number) => {
  setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
};

// Filtrar proyectos según el término de búsqueda - memoizado para optimizar rendimiento
const filteredProjects = useMemo(() => {
  if (!debouncedSearchTerm) return projects;

  const searchTermLower = debouncedSearchTerm.toLowerCase();
  return projects.filter((project) => {
    const projectTitle = getProjectTitle(project).toLowerCase();

    return (
      projectTitle.includes(searchTermLower) ||
      project.observations?.toLowerCase().includes(searchTermLower) ||
      project.ProjectRequestCompany?.Company?.companyName
        ?.toLowerCase()
        .includes(searchTermLower) ||
      project.ProjectRequestCompany?.Company?.comercialName
        ?.toLowerCase()
        .includes(searchTermLower)
    );
  });
}, [projects, debouncedSearchTerm]); // ✅ Usar debouncedSearchTerm para filtrado

if (roleLoading) {
  return <TableSkeleton columns={5} rows={5} />;
}

return (
  <>
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Proyectos</CardTitle>
              <CardDescription>
                Administra el estado y avance de todos los proyectos
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="show-active">Activos</Label>
              <Switch
                id="show-active"
                checked={showActive}
                onCheckedChange={setShowActive}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Controles de búsqueda y paginación */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar proyectos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-full"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="items-per-page">Mostrar:</Label>
                  <select
                    id="items-per-page"
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    className="border rounded px-2 py-1"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Tabla de proyectos */}
              <div className="border rounded-lg">
                {loading ? (
                  <TableSkeleton columns={5} rows={itemsPerPage} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>Proyecto</TableHead>
                          <TableHead>Avance General</TableHead>
                          <TableHead>Inicio de Proyecto</TableHead>
                          <TableHead>Término de Proyecto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProjects.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              No se encontraron proyectos
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredProjects.map((project) => (
                            <React.Fragment key={project.id}>
                              <TableRow className="cursor-pointer hover:bg-muted/50">
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      toggleProjectExpansion(project.id)
                                    }
                                  >
                                    {expandedProjectId === project.id ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {getProjectTitle(project)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={getProgressBadgeClass(project)}
                                  >
                                    {getProjectProgressText(project)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {project.projectStartDate ? formatDateForDisplay(project.projectStartDate) : '-'}
                                </TableCell>
                                <TableCell>
                                  {project.projectEndDate ? formatDateForDisplay(project.projectEndDate) : '-'}
                                </TableCell>
                              </TableRow>
                              {expandedProjectId === project.id && (
                                <TableRow>
                                  <TableCell
                                    colSpan={5}
                                    className="p-0 border-t-0"
                                  >
                                    <div className="px-4 pb-4">
                                       <ProjectManagementOverview
                                         projectId={project.id}
                                         projectRequirements={project.ProjectRequirements || []}
                                         isExpanded={expandedProjectId === project.id}
                                         onOpenStagesModal={() => {
                                           setSelectedProject(project);
                                           setStagesModalOpen(true);
                                         }}
                                         onProjectStatusChange={(status, progress) => {
                                           updateProjectStatus(project.id, status, progress);
                                         }}
                                       />
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
                 )}
               </div>
             </div>
           </CardContent>
         </Card>
         
         {/* Componente de paginación */}
         <div className="flex justify-center py-4">
           <Pagination
             currentPage={currentPage}
             totalPages={totalPages}
             onPageChange={setCurrentPage}
           />
         </div>
       </div>

       {/* Modal de Gestión de Etapas */}
       {selectedProject && (
         <ProjectStagesModal
           open={stagesModalOpen}
           onOpenChange={setStagesModalOpen}
           projectId={selectedProject.id}
           projectTitle={getProjectTitle(selectedProject)}
           onSuccess={() => {
             // Actualización optimista: refrescar los datos del proyecto expandido
             if (expandedProjectId === selectedProject.id) {
               // Forzar re-renderizado del componente ProjectManagementOverview
               setExpandedProjectId(null);
               setTimeout(() => setExpandedProjectId(selectedProject.id), 10);
             }
             refreshProjectOverview();
           }}
         />
       )}
     </>
   );
 }
