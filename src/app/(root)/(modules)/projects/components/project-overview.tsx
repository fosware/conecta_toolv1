"use client";

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Stepper, type Step, type StepStatus } from "@/components/ui/stepper";
import { ChevronRight, CheckCircle2, Circle, Clock, ArrowRight, Loader2, Plus } from "lucide-react";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";
import { getProjectStatusById, type ProjectStatusId, getProjectStatusByKey } from "@/config/project-status";
import { ActivityKanbanBoard } from "./activity-kanban-board";


interface ProjectCategory {
  id: number;
  name: string;
  description: string;
  projectId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Añadimos un campo para el estado de la categoría
  status?: "pending" | "in-progress" | "completed";
  // Añadimos un campo para las actividades de la categoría
  activities?: Activity[];
}

interface Activity {
  id: number;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  dueDate?: string;
  categoryId: number;
  assignedTo?: string;
  isDeleted?: boolean;
  dateDeleted?: string;
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

interface ProjectOverviewProps {
  projectId: number;
  projectTitle: string;
  refreshKey?: number; // Prop para forzar refresco cuando cambia
  onProjectStatusChange?: (projectId: number, progress: number, status: string) => void; // Callback para notificar cambios en el estado del proyecto
}

export interface ProjectOverviewRef {
  refreshCategories: () => Promise<void>;
}

const ProjectOverview = forwardRef<ProjectOverviewRef, ProjectOverviewProps>(function ProjectOverview({
  projectId,
  projectTitle,
  refreshKey = 0,
  onProjectStatusChange,
}, ref) {
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [progressValue, setProgressValue] = useState<number>(0);

  const [projectStatusBadge, setProjectStatusBadge] = useState<{ text: string; class: string }>({
    text: "Por iniciar", 
    class: "bg-slate-100 text-slate-700"
  });

  // Exponer método de refresh a través del ref
  useImperativeHandle(ref, () => ({
    refreshCategories: fetchCategories
  }));

  // Calcular el progreso general del proyecto basado en las categorías
  const calculateProgress = (categories: ProjectCategory[]): number => {
    if (categories.length === 0) return 0;

    // Calcular el progreso basado en las actividades completadas
    let totalActivities = 0;
    let completedActivities = 0;
    let inProgressActivities = 0;
    
    // Recorrer todas las categorías y sus actividades
    categories.forEach(category => {
      // Si la categoría tiene actividades
      if (category.activities && category.activities.length > 0) {
        // Contar todas las actividades (excepto canceladas y eliminadas)
        const activeActivities = category.activities.filter(
          (activity: Activity) => activity.status !== "cancelled" && !activity.isDeleted
        );
        totalActivities += activeActivities.length;
        
        // Contar las actividades completadas (excluyendo eliminadas)
        completedActivities += category.activities.filter(
          (activity: Activity) => activity.status === "completed" && !activity.isDeleted
        ).length;
        
        // Contar las actividades en progreso (excluyendo eliminadas)
        inProgressActivities += category.activities.filter(
          (activity: Activity) => activity.status === "in-progress" && !activity.isDeleted
        ).length;
      }
    });
    
    // Calcular el porcentaje de progreso SOLO basado en actividades completadas
    // No consideramos actividades en progreso para el porcentaje
    const progress = totalActivities > 0 ? (completedActivities / totalActivities) : 0;
    
    // El porcentaje debe ser 0 si no hay actividades completadas, incluso si hay en progreso
    // Solo cambiamos el estado a "En progreso" pero no el porcentaje
    return Math.round(progress * 100);
  };
  
  // Calcular el progreso para una categoría específica
  const calculateCategoryProgress = (category: ProjectCategory): number => {
    if (!category.activities || category.activities.length === 0) return 0;
    
    // Contar todas las actividades (excepto canceladas y eliminadas)
    const activeActivities = category.activities.filter(
      (activity: Activity) => activity.status !== "cancelled" && !activity.isDeleted
    );
    
    if (activeActivities.length === 0) return 0;
    
    // Contar las actividades completadas
    const completedActivities = category.activities.filter(
      (activity: Activity) => activity.status === "completed" && !activity.isDeleted
    ).length;
    
    // Calcular el porcentaje de progreso
    const progress = completedActivities / activeActivities.length;
    
    return Math.round(progress * 100);
  };
  
  // Función para obtener el estado del proyecto basado en el progreso y si hay actividades en progreso
  const getProjectStatusBadge = (progressValue: number, hasInProgressActivities: boolean = false): { text: string; class: string } => {
    if (progressValue === 100) {
      return { text: "Completado", class: "bg-green-100 text-green-700" };
    } else if (progressValue > 0 || hasInProgressActivities) {
      return { text: "En progreso", class: "bg-blue-100 text-blue-700" };
    } else {
      return { text: "Por iniciar", class: "bg-slate-100 text-slate-700" };
    }
  };

  // Función para obtener el ícono según el estado
  const getStatusIcon = (status?: string) => {
    if (status === "completed") {
      return <CheckCircle2 className="h-8 w-8 text-green-500" />;
    } else if (status === "in-progress") {
      return <Circle className="h-8 w-8 text-yellow-500 animate-pulse" />;
    } else {
      return <Circle className="h-8 w-8 text-slate-300" />;
    }
  };

  // Función para obtener el color de borde según el estado de la categoría
  const getCategoryBorderColor = (status?: string) => {
    if (status === "completed") {
      return "border-green-500";
    } else if (status === "in-progress") {
      return "border-yellow-500";
    } else {
      return "border-slate-200";
    }
  };

  // Función para obtener el texto de estado de la categoría
  const getCategoryStatusText = (status?: string) => {
    if (status === "completed") {
      return "Completada";
    } else if (status === "in-progress") {
      return "En progreso";
    } else {
      return "Por iniciar";
    }
  };

  // Función para obtener la clase de badge según el estado
  const getCategoryStatusBadgeClass = (status?: string) => {
    if (status === "completed") return "bg-green-100 text-green-700";
    if (status === "in-progress") return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-700";
  };

  // Cargar las actividades de una categoría
  const fetchActivitiesByCategory = async (categoryId: number) => {
    try {
      setLoadingActivities(true);
      
      // Obtener las actividades para esta categoría
      const response = await fetch(`/api/projects/${projectId}/categories/${categoryId}/activities`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Mapear las actividades con el formato requerido
        const mappedActivities: Activity[] = data.map((activity: any) => ({
          id: activity.id,
          title: activity.name,
          description: activity.description || "",
          status: activity.projectCategoryActivityStatusId === 3 ? "completed" :
                  activity.projectCategoryActivityStatusId === 2 ? "in-progress" :
                  activity.projectCategoryActivityStatusId === 4 ? "cancelled" : "pending",
          categoryId: categoryId,
          dueDate: activity.dateTentativeEnd,
          assignedTo: activity.assignedTo
        }));
        
        setActivities(mappedActivities);
      } else {
        toast.error("Error al cargar las actividades");
      }
    } catch (error) {
      console.error("Error al cargar actividades:", error);
      toast.error("Error al cargar las actividades");
    } finally {
      setLoadingActivities(false);
    }
  };

  // Cargar las categorías del proyecto y sus actividades
  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      // OPTIMIZACIÓN: Intentar con nuevo endpoint que incluye actividades
      let data: any[];
      let useOptimizedEndpoint = true;
      
      try {
        const response = await fetch(`/api/projects/${projectId}/categories?includeActivities=true`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });
        
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error('Optimized endpoint failed');
        }
      } catch (error) {
        // FALLBACK: Si el endpoint optimizado falla, usar método antiguo
        console.warn('Falling back to old method for fetching categories');
        useOptimizedEndpoint = false;
        const response = await fetch(`/api/projects/${projectId}/categories`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        data = await response.json();
      }
      
      // Asegurarse de que las categorías estén en el orden correcto
      const sortedData = [...data].sort((a, b) => a.id - b.id);
      
      const mappedCategories: ProjectCategory[] = await Promise.all(
        sortedData.map(async (category: any) => {
          let activities: Activity[] = [];
          
          if (useOptimizedEndpoint && category.ProjectCategoryActivity) {
            // OPTIMIZADO: Actividades ya vienen en la respuesta
            activities = category.ProjectCategoryActivity.map((activity: any) => ({
              id: activity.id,
              title: activity.name,
              description: activity.description || "",
              status: activity.projectCategoryActivityStatusId === 3 ? "completed" :
                      activity.projectCategoryActivityStatusId === 2 ? "in-progress" :
                      activity.projectCategoryActivityStatusId === 4 ? "cancelled" : "pending",
              categoryId: category.id,
              dueDate: activity.dateTentativeEnd,
              assignedTo: activity.assignedTo
            }));
          } else {
            // FALLBACK: Obtener actividades con llamada separada (método antiguo)
            const activityResponse = await fetch(`/api/projects/${projectId}/categories/${category.id}/activities`, {
              headers: {
                Authorization: `Bearer ${getToken()}`,
              },
            });
            
            if (activityResponse.ok) {
              const activityData = await activityResponse.json();
              activities = activityData.map((activity: any) => ({
                id: activity.id,
                title: activity.name,
                description: activity.description || "",
                status: activity.projectCategoryActivityStatusId === 3 ? "completed" :
                        activity.projectCategoryActivityStatusId === 2 ? "in-progress" :
                        activity.projectCategoryActivityStatusId === 4 ? "cancelled" : "pending",
                categoryId: category.id,
                dueDate: activity.dateTentativeEnd,
                assignedTo: activity.assignedTo
              }));
            }
          }
          
          // Determinar el estado de la categoría basado en sus actividades
          let status = "pending";
          if (activities.length > 0) {
            const completedActivities = activities.filter(a => a.status === "completed").length;
            const inProgressActivities = activities.filter(a => a.status === "in-progress").length;
            const totalActivities = activities.length;
            
            if (completedActivities === totalActivities) {
              status = "completed";
            } else if (inProgressActivities > 0 || completedActivities > 0) {
              status = "in-progress";
            }
          }
          
          return {
            id: category.id,
            name: category.name,
            description: category.description,
            status: status as "pending" | "in-progress" | "completed",
            activities: activities,
            projectId: category.projectId,
            isActive: category.isActive,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
          };
        })
      );
      
      setCategories(mappedCategories);
      
      // Calcular y actualizar el progreso general del proyecto
      const newProgress = calculateProgress(mappedCategories);
      setProgressValue(newProgress);
      
      // Verificar si hay actividades en progreso para el estado del proyecto
      let hasInProgressActivities = false;
      mappedCategories.forEach(category => {
        if (category.activities && category.activities.some(activity => activity.status === "in-progress")) {
          hasInProgressActivities = true;
        }
      });
      
      // Actualizar el estado del proyecto basado en el progreso
      const initialStatusBadge = getProjectStatusBadge(newProgress, hasInProgressActivities);
      setProjectStatusBadge(initialStatusBadge);
      
      // Notificar al componente padre del progreso inicial
      if (onProjectStatusChange) {
        onProjectStatusChange(projectId, newProgress, initialStatusBadge.text);
      }
      
      // Si no hay categoría activa, seleccionar la primera
      if (mappedCategories.length > 0 && !activeCategoryId) {
        setActiveCategoryId(mappedCategories[0].id);
        // Cargar las actividades de la primera categoría
        if (mappedCategories[0].activities) {
          setActivities(mappedCategories[0].activities);
        }
      }
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      toast.error("Error al cargar las categorías del proyecto");
    } finally {
      setLoading(false);
    }
  };

  // Manejar el cambio de categoría activa
  const handleCategoryChange = (categoryId: number) => {
    setActiveCategoryId(categoryId);
    
    // Buscar la categoría seleccionada
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    
    // Si la categoría tiene actividades precargadas, usarlas
    if (selectedCategory && selectedCategory.activities) {
      setActivities(selectedCategory.activities);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [refreshKey]); // Recargar cuando cambie refreshKey

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No hay categorías definidas para este proyecto.
      </div>
    );
  }

  // Encontrar la categoría activa
  const activeCategory = categories.find(cat => cat.id === activeCategoryId) || categories[0];

  return (
    <div className="p-6 bg-card rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 mt-4 mb-6">
      <div className="flex flex-col space-y-6">
        {/* Título, Progreso y Botón de Bitácora */}
        <div className="flex flex-col items-center space-y-3">
          <div className="flex items-center justify-center w-full">
            <h2 className="text-xl font-semibold text-center">{projectTitle}</h2>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <span className="text-sm font-medium">{progressValue}% completado</span>
            <Badge variant="outline" className={projectStatusBadge.class}>
              {projectStatusBadge.text}
            </Badge>
          </div>
        </div>

        {/* Stepper visual usando el componente reutilizable */}
        <Stepper 
          steps={categories.map(category => ({
            id: category.id,
            title: category.name,
            description: category.description || undefined,
            status: category.status as StepStatus,
            progress: calculateCategoryProgress(category) // Añadir el progreso de cada categoría
          }))} 
          progress={progressValue}
          activeStepId={activeCategoryId || undefined}
          onStepClick={(stepId) => handleCategoryChange(stepId as number)}
        />

        {/* Detalles de la categoría activa */}
        <div className="mb-3">
          <Card className="w-full rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="flex">
              <div 
                className="w-2 h-auto rounded-l-lg" 
                style={{ 
                  backgroundColor: activeCategory?.status === "completed" ? "#22c55e" : 
                                activeCategory?.status === "in-progress" ? "#3b82f6" : "#94a3b8" 
                }}
              ></div>
              <CardContent className="py-3 px-4 w-full">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-semibold dark:text-white">
                      {activeCategory?.name}
                    </h4>
                    <p className="text-xs text-muted-foreground dark:text-gray-300 mt-0.5">
                      {activeCategory?.description || "Sin descripción"}
                    </p>
                    {activeCategory && (
                      <div className="flex items-center mt-1.5">
                        <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ 
                              width: `${calculateCategoryProgress(activeCategory)}%`,
                              backgroundColor: activeCategory.status === "completed" ? "#22c55e" : 
                                              activeCategory.status === "in-progress" ? "#3b82f6" : "#94a3b8"
                            }}
                          ></div>
                        </div>
                        <span className="text-xs ml-2 text-muted-foreground dark:text-gray-300">
                          {calculateCategoryProgress(activeCategory)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge className={getCategoryStatusBadgeClass(activeCategory?.status)} variant="outline">
                    {getCategoryStatusText(activeCategory?.status)}
                  </Badge>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Tablero Kanban de actividades */}
        {activeCategory && (
          <ActivityKanbanBoard 
            projectId={projectId} 
            categoryId={activeCategory.id}
            onActivityStatusChange={async (updatedActivity, newStatusId) => {
              try {
                // Optimización: En lugar de volver a cargar todas las actividades,
                // actualizamos directamente la actividad que cambió
                if (!activeCategory) return;
                
                // Convertir el estado numérico a string para nuestro modelo interno
                const activityStatus: "pending" | "in-progress" | "completed" | "cancelled" = 
                  newStatusId === 3 ? "completed" :
                  newStatusId === 2 ? "in-progress" :
                  newStatusId === 4 ? "cancelled" : "pending";
                
                // Crear una versión de la actividad compatible con nuestro modelo interno
                const internalUpdatedActivity: Activity = {
                  id: updatedActivity.id,
                  title: updatedActivity.name || "",
                  description: updatedActivity.description || "",
                  status: activityStatus,
                  categoryId: activeCategory.id,
                  dueDate: updatedActivity.dateTentativeEnd || undefined,
                  assignedTo: updatedActivity.assignedTo
                };
                
                // Actualizar las actividades mostradas con un setTimeout para evitar actualizar durante el renderizado
                if (activities.length > 0) {
                  const updatedLocalActivities = activities.map(activity => {
                    if (activity.id === internalUpdatedActivity.id) {
                      return internalUpdatedActivity;
                    }
                    return activity;
                  });
                  
                  // Usar setTimeout para evitar actualizar el estado durante el renderizado
                  setTimeout(() => {
                    setActivities(updatedLocalActivities);
                  }, 0);
                }
                
                setCategories(prevCategories => {
                  // Copia profunda para evitar problemas de mutación
                  const newCategories = [...prevCategories];
                  
                  // Encontrar la categoría actual
                  const categoryIndex = newCategories.findIndex(cat => cat.id === activeCategory.id);
                  if (categoryIndex === -1) return prevCategories;
                  
                  const currentCategory = {...newCategories[categoryIndex]};
                  if (!currentCategory.activities) currentCategory.activities = [];
                  
                  // Actualizar la actividad en la lista
                  const updatedActivities = currentCategory.activities.map(activity => {
                    if (activity.id === internalUpdatedActivity.id) {
                      return internalUpdatedActivity;
                    }
                    return activity;
                  });
                  
                  // Determinar el estado de la categoría basado en sus actividades
                  let categoryStatus: "pending" | "in-progress" | "completed" = "pending";
                  if (updatedActivities.length > 0) {
                    const activeActivities = updatedActivities.filter(a => a.status !== "cancelled");
                    if (activeActivities.length === 0) {
                      categoryStatus = "pending";
                    } else {
                      const completedActivities = activeActivities.filter(a => a.status === "completed").length;
                      const inProgressActivities = activeActivities.filter(a => a.status === "in-progress").length;
                      
                      if (completedActivities === activeActivities.length) {
                        categoryStatus = "completed";
                      } else if (inProgressActivities > 0 || completedActivities > 0) {
                        categoryStatus = "in-progress";
                      }
                    }
                  }
                  
                  // Actualizar la categoría
                  currentCategory.activities = updatedActivities;
                  currentCategory.status = categoryStatus;
                  newCategories[categoryIndex] = currentCategory;
                  
                  // Calcular el nuevo progreso con las categorías actualizadas
                  const newProgress = calculateProgress(newCategories);
                  
                  // Verificar si hay actividades en progreso para el estado del proyecto
                  let hasInProgressActivities = false;
                  newCategories.forEach(category => {
                    if (category.activities && category.activities.some(activity => activity.status === "in-progress")) {
                      hasInProgressActivities = true;
                    }
                  });
                  
                  // Actualizar el progreso y el estado del proyecto
                  // Hacemos esto fuera del setState para evitar renders adicionales
                  setTimeout(() => {
                    setProgressValue(newProgress);
                    const newStatusBadge = getProjectStatusBadge(newProgress, hasInProgressActivities);
                    setProjectStatusBadge(newStatusBadge);
                    
                    // Notificar al componente padre del cambio de estado del proyecto
                    if (onProjectStatusChange) {
                      onProjectStatusChange(projectId, newProgress, newStatusBadge.text);
                    }
                  }, 0);
                  
                  return newCategories;
                });
              } catch (error) {
                console.error('Error al actualizar estado de categoría:', error);
              }
            }}
          />
        )}

        {/* Se eliminó el resumen de progreso a petición del usuario */}
      </div>


    </div>
  );
});

export default ProjectOverview;
