"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Settings } from "lucide-react";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";

interface ProjectStage {
  id: number;
  name: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
  progress: number;
  assignedCompany?: {
    id: number;
    name: string;
  };
  categories: ProjectCategory[];
}

interface ProjectCategory {
  id: number;
  name: string;
  description: string;
  progress: number;
  status: "pending" | "in-progress" | "completed";
  assignedCompany: {
    id: number;
    name: string;
  };
  activities: ProjectActivity[];
  stageId?: number;
  requirement?: {
    id: number;
    name: string;
    projectRequest?: {
      id: number;
      title: string;
    };
  };
}

interface ProjectActivity {
  id: number;
  name: string;
  status: "pending" | "in-progress" | "completed";
}

interface ProjectRequirement {
  id: number;
  requirementName?: string;
  description?: string;
  ProjectRequestCompany?: {
    id: number;
    Company?: {
      id: number;
      companyName?: string;
      comercialName?: string;
    };
    Project?: any[];
  }[];
}

interface ProjectManagementOverviewProps {
  projectId: number;
  projectRequirements?: ProjectRequirement[];
  isExpanded: boolean;
  onOpenStagesModal?: () => void;
  onProjectStatusChange?: (status: string, progress: number) => void;
}

export function ProjectManagementOverview({
  projectId,
  projectRequirements = [],
  isExpanded,
  onOpenStagesModal,
  onProjectStatusChange,
}: ProjectManagementOverviewProps) {
  const [data, setData] = useState<{
    stages: ProjectStage[];
    categories: ProjectCategory[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [draggedCategory, setDraggedCategory] =
    useState<ProjectCategory | null>(null);

  // ✅ Calcular progreso general del proyecto usando useMemo (optimizado)
  const projectProgress = useMemo(() => {
    if (!data?.stages || data.stages.length === 0) return 0;
    const totalProgress = data.stages.reduce((sum, stage) => sum + stage.progress, 0);
    return Math.round(totalProgress / data.stages.length);
  }, [data?.stages]);

  // ✅ Determinar estado del proyecto basado en el progreso usando useMemo (optimizado)
  const projectStatus = useMemo(() => {
    if (projectProgress === 100) return "Completado";
    if (projectProgress > 0) return "En progreso";
    return "Por iniciar";
  }, [projectProgress]);

  // ✅ Memoizar cálculos de altura dinámica
  const dynamicHeight = useMemo(() => {
    if (!data?.stages) return "200px";
    const stageCount = data.stages.length;
    const baseHeight = 150;
    const heightPerStage = 120;
    return `${Math.max(baseHeight, stageCount * heightPerStage)}px`;
  }, [data?.stages]);

  // Usar useRef para evitar llamadas innecesarias
  const lastNotifiedStatus = useRef<{status: string, progress: number} | null>(null);

  // Notificar cambios de estado al componente padre solo cuando realmente cambien
  useEffect(() => {
    if (data && onProjectStatusChange) {
      const currentState = { status: projectStatus, progress: projectProgress };
      const lastState = lastNotifiedStatus.current;
      
      if (!lastState || lastState.status !== currentState.status || lastState.progress !== currentState.progress) {
        onProjectStatusChange(projectStatus, projectProgress);
        lastNotifiedStatus.current = currentState;
      }
    }
  }, [data, projectStatus, projectProgress, onProjectStatusChange]);

  // ✅ Optimizar fetchProjectData con useCallback
  // Procesar datos de projectRequirements en lugar de hacer llamada al API
  const processProjectData = useCallback(async () => {
    // Evitar llamadas concurrentes
    if (isProcessing) {

      return;
    }
    
    if (!projectRequirements || projectRequirements.length === 0) {
      setData({ stages: [], categories: [] });
      setLoading(false);
      return;
    }

    try {
      setIsProcessing(true);
      setLoading(true);
      
      // Obtener todas las categorías reales desde la vista materializada
      // Obtener todas las categorías reales desde la vista materializada
      const categoriesResponse = await fetch(`/api/project_management/${projectId}/categories`);
      let allRealCategories = [];
      
      if (categoriesResponse.ok) {
        allRealCategories = await categoriesResponse.json();
      }
      
      // Obtener todas las etapas reales
      const stagesResponse = await fetch(`/api/project_management/${projectId}/project-stages`);
      let allRealStages = [];
      
      if (stagesResponse.ok) {
        allRealStages = await stagesResponse.json();
      }
      
      const stages: ProjectStage[] = [];
      const categories: ProjectCategory[] = [];
      
      // Procesar cada requerimiento con empresa asignada
      projectRequirements.forEach((requirement, reqIndex) => {
        const assignedCompanies = requirement.ProjectRequestCompany?.filter(company => 
          company.Project && company.Project.length > 0
        ) || [];
        
        if (assignedCompanies.length > 0) {
          assignedCompanies.forEach((company) => {
            const requirementName = requirement.requirementName || `Requerimiento ${reqIndex + 1}`;
            const companyName = company.Company?.comercialName || company.Company?.companyName || 'Sin nombre';
            
            // Obtener todas las categorías reales para este proyecto
            const projectIds = company.Project?.map(p => p.id) || [];
            const companyCategoriesReal = allRealCategories.filter((cat: any) => 
              projectIds.includes(cat.projectId)
            );
            
            // Si hay categorías reales, crear una entrada por cada categoría
            if (companyCategoriesReal.length > 0) {
              companyCategoriesReal.forEach((realCat: any) => {
                const category: ProjectCategory = {
                  id: realCat.id,
                  name: realCat.name,
                  description: realCat.description || 'Sin descripción',
                  progress: Number(realCat.progress) || 0,
                  status: realCat.status || 'pending',
                  stageId: realCat.stageId,
                  assignedCompany: {
                    id: company.Company?.id || 0,
                    name: companyName
                  },
                  activities: realCat.activities || [],
                  requirement: {
                    id: requirement.id,
                    name: requirementName,
                    projectRequest: {
                      id: projectId,
                      title: 'Proyecto'
                    }
                  }
                };
                categories.push(category);
              });
            } else {
              // Fallback si no hay categorías reales
              const category: ProjectCategory = {
                id: requirement.id * 1000 + company.id,
                name: `Actividades de ${requirementName}`,
                description: 'Sin descripción',
                progress: 0,
                status: 'pending',
                assignedCompany: {
                  id: company.Company?.id || 0,
                  name: companyName
                },
                activities: [{
                  id: 1,
                  name: 'Actividad pendiente de configurar',
                  status: 'pending'
                }],
                requirement: {
                  id: requirement.id,
                  name: requirementName,
                  projectRequest: {
                    id: projectId,
                    title: 'Proyecto'
                  }
                }
              };
              categories.push(category);
            }
          });
        }
      });
      
      // Procesar etapas reales
      allRealStages.forEach((realStage: any) => {
        const stage: ProjectStage = {
          id: realStage.id,
          name: realStage.name,
          description: realStage.description || '',
          status: realStage.status as "pending" | "in-progress" | "completed",
          progress: Number(realStage.progress) || 0,
          assignedCompany: realStage.assignedCompany,
          categories: realStage.categories || []
        };
        stages.push(stage);
      });

      // Debug: Datos procesados correctamente

      setData({ stages, categories });
    } catch (error) {
      console.error('Error procesando datos del proyecto:', error);
      setData({ stages: [], categories: [] });
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  }, [projectRequirements, projectId]); // Dependencia de projectRequirements

  useEffect(() => {
    if (isExpanded) {
      // Pequeño delay para evitar llamadas muy rápidas
      const timeoutId = setTimeout(() => {
        processProjectData();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isExpanded, processProjectData]); // ✅ Dependencias optimizadas

  const handleDragStart = (e: React.DragEvent, category: ProjectCategory) => {
    setDraggedCategory(category);
    e.dataTransfer.setData("text/plain", category.id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {

    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, stageId: number) => {
    e.preventDefault();
    if (!draggedCategory || !data) {
      return;
    }

    const originalStageId = draggedCategory.stageId;
    
    // Actualización optimista del UI
    const updatedCategories = data.categories.map((cat) =>
      cat.id === draggedCategory.id ? { ...cat, stageId: stageId } : cat
    );

    const updatedStages = data.stages.map((stage) => ({
      ...stage,
      categories: updatedCategories.filter((cat) => cat.stageId === stage.id),
    }));

    setData({
      stages: updatedStages,
      categories: updatedCategories,
    });

    try {
      // Hacer llamada al backend
      const token = getToken();
      if (!token) {
        toast.error("No se encontró token de autenticación");
        return;
      }

      const url = `/api/project_management/${projectId}/categories/${draggedCategory.id}/assign-stage`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stageId }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al asignar categoría: ${response.status} - ${errorText}`);
      }

      toast.success(`Categoría "${draggedCategory.name}" movida exitosamente`);
      
      // Actualizar progreso de etapas afectadas
      await updateStageProgressAfterChange(stageId);
      if (originalStageId && originalStageId !== stageId) {
        await updateStageProgressAfterChange(originalStageId);
      }
      
    } catch (error) {
      console.error("Error moving category:", error);
      toast.error("Error al mover la categoría");
      
      // Revertir cambio optimista
      const revertedCategories = data.categories.map((cat) =>
        cat.id === draggedCategory.id ? { ...cat, stageId: originalStageId } : cat
      );

      const revertedStages = data.stages.map((stage) => ({
        ...stage,
        categories: revertedCategories.filter((cat) => cat.stageId === stage.id),
      }));

      setData({
        stages: revertedStages,
        categories: revertedCategories,
      });
    }

    setDraggedCategory(null);
  };

  // Función para actualizar progreso de etapa después de cambios
  const updateStageProgressAfterChange = async (stageId?: number) => {
    if (!stageId || !data) return;
    
    try {
      const token = getToken();
      if (!token) return;
      
      // Obtener progreso actualizado de la etapa
      const stageResponse = await fetch(`/api/project_management/${projectId}/project-stages`);
      if (stageResponse.ok) {
        const updatedStages = await stageResponse.json();
        const updatedStage = updatedStages.find((s: any) => s.id === stageId);
        
        if (updatedStage) {
          // Actualizar solo la etapa específica en el estado
          setData(prevData => {
            if (!prevData) return prevData;
            
            const updatedStagesData = prevData.stages.map(stage => 
              stage.id === stageId 
                ? { ...stage, progress: Number(updatedStage.progress) || 0, status: updatedStage.status }
                : stage
            );
            
            return {
              ...prevData,
              stages: updatedStagesData
            };
          });
          
          // Notificar al componente padre sobre el cambio de progreso
          if (onProjectStatusChange) {
            const totalProgress = data.stages.reduce((sum, stage) => 
              sum + (stage.id === stageId ? (Number(updatedStage.progress) || 0) : stage.progress), 0
            );
            const averageProgress = Math.round(totalProgress / data.stages.length);
            
            let status = 'Por iniciar';
            if (averageProgress > 0 && averageProgress < 100) {
              status = 'En progreso';
            } else if (averageProgress === 100) {
              status = 'Completado';
            }
            
            onProjectStatusChange(status, averageProgress);
          }
        }
      }
    } catch (error) {
      console.error('Error updating stage progress:', error);
    }
  };

  const removeFromStage = async (categoryId: number) => {
    if (!data) return;

    const category = data.categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const originalStageId = category.stageId;

    // Actualización optimista del UI
    const updatedCategories = data.categories.map((cat) =>
      cat.id === categoryId ? { ...cat, stageId: undefined } : cat
    );

    const updatedStages = data.stages.map((stage) => ({
      ...stage,
      categories: updatedCategories.filter((cat) => cat.stageId === stage.id),
    }));

    setData({
      stages: updatedStages,
      categories: updatedCategories,
    });

    try {
      // Hacer llamada al backend
      const token = getToken();
      if (!token) {
        toast.error("No se encontró token de autenticación");
        return;
      }

      const response = await fetch(
        `/api/project_management/${projectId}/categories/${categoryId}/assign-stage`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ stageId: null }), // null para remover
        }
      );

      if (!response.ok) {
        throw new Error(`Error al remover categoría: ${response.status}`);
      }

      toast.success("Categoría removida de la etapa");
      
      // Actualizar progreso de etapas sin recargar toda la interfaz
      await updateStageProgressAfterChange(originalStageId);
      
    } catch (error) {
      console.error("Error removing category from stage:", error);
      toast.error("Error al remover la categoría");
      
      // Revertir cambio optimista
      const revertedCategories = data.categories.map((cat) =>
        cat.id === categoryId ? { ...cat, stageId: originalStageId } : cat
      );

      const revertedStages = data.stages.map((stage) => ({
        ...stage,
        categories: revertedCategories.filter((cat) => cat.stageId === stage.id),
      }));

      setData({
        stages: revertedStages,
        categories: revertedCategories,
      });
    }
  };

  if (!isExpanded) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No se pudieron cargar los datos del proyecto
      </div>
    );
  }

  const { stages, categories } = data;
  const unassignedCategories = categories.filter((cat) => !cat.stageId);

  return (
    <div className="space-y-8 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna izquierda: Categorías */}
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-700/50 border border-border dark:border-border-dark">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">
              Categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(
                unassignedCategories.reduce(
                  (acc, category) => {
                    const requirementName =
                      category.requirement?.name || "Requerimiento 1";

                    if (!acc[requirementName]) {
                      acc[requirementName] = {};
                    }

                    const companyName =
                      category.assignedCompany?.name || "Sin asignar";

                    if (!acc[requirementName][companyName]) {
                      acc[requirementName][companyName] = [];
                    }

                    acc[requirementName][companyName].push(category);
                    return acc;
                  },
                  {} as Record<string, Record<string, ProjectCategory[]>>
                )
              ).map(([requirementName, companies]) => (
                <div key={requirementName} className="space-y-4">
                  {/* Requerimiento */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-3">
                    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                      {requirementName}
                    </h3>
                  </div>

                  {/* Asociados y sus categorías */}
                  {Object.entries(companies).map(
                    ([companyName, categories]) => (
                      <div
                        key={`${requirementName}-${companyName}`}
                        className="ml-4 space-y-3"
                      >
                        {/* Asociado */}
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-md p-2">
                          <h4 className="text-sm font-medium text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                            {companyName}
                            <Badge variant="outline" className="text-xs">
                              {categories.length}
                            </Badge>
                          </h4>
                        </div>

                        {/* Categorías */}
                        <div className="ml-3 space-y-2">
                          {categories.map((category) => (
                            <Card
                              key={category.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, category)}
                              className="relative group cursor-move transition-all duration-200 hover:shadow-md hover:border-primary/30 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-slate-200 dark:border-slate-600"
                            >
                              <div className="absolute top-2 left-2 opacity-30 group-hover:opacity-70 transition-opacity">
                                <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                              </div>
                              <CardContent className="p-3 pl-6">
                                <div>
                                  <p className="font-medium text-sm text-gray-800 dark:text-gray-200">
                                    {category.name}
                                  </p>
                                  {category.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                      {category.description}
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Columna derecha: Etapas */}
        <Card className="bg-gradient-to-br from-slate-50 to-gray-100/50 dark:from-slate-800 dark:to-gray-700/50 border border-border dark:border-border-dark">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Etapas
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onOpenStagesModal}
                className="flex items-center gap-2 border-slate-200 dark:border-slate-700"
              >
                <Settings className="h-4 w-4" />
                Gestionar Etapas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stages.map((stage) => (
                <StageDropZone
                  key={stage.id}
                  stage={stage}
                  onCategoryDrop={async (categoryId) => {
                    if (!data) return;
                    
                    // Encontrar la categoría que se está moviendo
                    const categoryToMove = data.categories.find(cat => cat.id === categoryId);
                    if (!categoryToMove) {
                      return;
                    }
                    
                    // Simular el evento de drag para usar handleDrop
                    const fakeEvent = {
                      preventDefault: () => {}
                    } as React.DragEvent;
                    
                    // Establecer la categoría arrastrada temporalmente
                    setDraggedCategory(categoryToMove);
                    
                    // Llamar a handleDrop con nuestra lógica de backend
                    await handleDrop(fakeEvent, stage.id);
                    
                    // handleDrop ya maneja la actualización del estado y el toast
                    // No necesitamos duplicar la lógica aquí
                  }}
                  onCategoryRemove={removeFromStage}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección de avance general */}
      <Card className="bg-gradient-to-br from-slate-50 to-gray-100/50 dark:from-slate-800 dark:to-gray-700/50 border border-border dark:border-border-dark">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Avance General del Proyecto
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge
                variant={
                  projectStatus === "Completado"
                    ? "default"
                    : projectStatus === "En progreso"
                      ? "secondary"
                      : "outline"
                }
                className="text-sm"
              >
                {projectStatus}
              </Badge>
              <span className="text-sm font-medium text-muted-foreground">
                {projectProgress}%
              </span>
            </div>
          </div>
          <div className="mt-3">
            <Progress value={projectProgress} className="h-3" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.stages.map((stage) => (
              <div key={stage.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{stage.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {stage.categories.length} categorías
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {stage.progress}%
                    </span>
                  </div>
                </div>
                <Progress value={stage.progress} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para las zonas de drop de etapas
function StageDropZone({
  stage,
  onCategoryDrop,
  onCategoryRemove,
}: {
  stage: ProjectStage;
  onCategoryDrop: (categoryId: number) => Promise<void>;
  onCategoryRemove: (categoryId: number) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  // Colores por estado de etapa
  const getStageColors = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-700/50',
          header: 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30',
          text: 'text-green-800 dark:text-green-300',
          badge: 'bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-200'
        };
      case 'in-progress':
        return {
          bg: 'bg-slate-50 dark:bg-slate-800/50',
          border: 'border-slate-300 dark:border-slate-600',
          header: 'bg-gradient-to-r from-slate-100 to-blue-50 dark:from-slate-700/50 dark:to-blue-900/20',
          text: 'text-slate-700 dark:text-slate-300',
          badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800/50',
          border: 'border-slate-200 dark:border-slate-600',
          header: 'bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-700/50 dark:to-gray-700/50',
          text: 'text-slate-800 dark:text-slate-200',
          badge: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
        };
    }
  };

  const colors = getStageColors(stage.status);
  
  // Calcular altura dinámica basada en la cantidad de categorías
  const getMinHeight = () => {
    const headerHeight = 80; // Altura del header de la etapa
    const baseContentHeight = 80; // Altura base del contenido (drop zone vacía)
    const categoryHeight = 48; // Altura por categoría (py-2 + border + spacing)
    const spacingBetweenCategories = 8; // space-y-2
    const categoriesCount = stage.categories.length;
    
    if (categoriesCount === 0) {
      return headerHeight + baseContentHeight; // Altura mínima para drop zone vacía
    }
    
    // Calcular altura dinámica: header + contenido base + (categorías * altura) + espaciado
    const categoriesHeight = (categoriesCount * categoryHeight) + ((categoriesCount - 1) * spacingBetweenCategories);
    const totalHeight = headerHeight + baseContentHeight + categoriesHeight;
    
    return Math.max(160, totalHeight); // Mínimo 160px
  };

  return (
    <Card
      className={`transition-all duration-200 ${colors.bg} ${colors.border} ${
        isDragOver ? "border-primary/50 bg-primary/10 border-2 shadow-md" : "border-2"
      }`}
      style={{ minHeight: `${getMinHeight()}px` }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => {
        setIsDragOver(false);
      }}
      onDrop={async (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const categoryId = parseInt(e.dataTransfer.getData("text/plain"));
        if (!isNaN(categoryId)) {
          await onCategoryDrop(categoryId);
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className={`${colors.header} -mx-6 -mt-6 px-6 pt-6 pb-3 rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <CardTitle className={`text-sm font-semibold ${colors.text}`}>
              {stage.name}
            </CardTitle>
            <Badge className={`${colors.badge} border-0 text-xs`}>
              {stage.categories.length} categorías
            </Badge>
          </div>
          {stage.description && (
            <p className={`text-xs ${colors.text} opacity-75 mt-1`}>
              {stage.description}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Categorías asignadas a esta etapa */}
          <div className="space-y-2">
            {stage.categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between bg-white/80 dark:bg-slate-600/80 backdrop-blur-sm rounded-md px-3 py-2 border border-white/50 dark:border-slate-500/50 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate block">
                    {category.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {category.assignedCompany?.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCategoryRemove(category.id)}
                  className="h-8 w-8 p-0 ml-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-md flex items-center justify-center"
                  title="Remover categoría de esta etapa"
                >
                  <span className="text-lg font-medium">×</span>
                </Button>
              </div>
            ))}
          </div>

          {stage.categories.length === 0 && (
            <div
              className={`text-xs text-center py-6 border-2 border-dashed rounded-lg transition-all duration-200 ${
                isDragOver
                  ? "text-primary border-primary/50 bg-primary/10 dark:bg-primary/20"
                  : "text-muted-foreground border-gray-300/50 dark:border-gray-600/50 bg-white/30 dark:bg-slate-700/30"
              }`}
            >
              <div className="space-y-1">
                <div className={`text-lg ${isDragOver ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
                  ↓
                </div>
                <div>
                  {isDragOver
                    ? "Suelta aquí la categoría"
                    : "Arrastra categorías aquí"}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
