"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { 
  Calendar, 
  Clock, 
  Plus, 
  Loader2, 
  User, 
  AlertCircle,
  Triangle,
  MoreHorizontal,
  GripVertical,
  Trash2,
  Pencil
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityFormDialog } from "./activity-form-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface ActivityKanbanBoardProps {
  projectId: number;
  categoryId: number;
  onActivityStatusChange?: (updatedActivity: Activity, newStatusId: number) => void; // Callback para notificar cambios en actividades
}

interface Activity {
  id: number;
  name: string;
  description: string | null;
  projectCategoryId: number;
  projectCategoryActivityStatusId: number;
  dateTentativeStart: string | null;
  dateTentativeEnd: string | null;
  observations: string | null;
  assignedTo?: string;
  isActive: boolean;
  isDeleted?: boolean;
  dateDeleted?: string;
  createdAt: string;
  updatedAt: string;
}

interface StatusColumn {
  id: number;
  name: string;
  activities: Activity[];
  color: string;
}

export function ActivityKanbanBoard({ projectId, categoryId, onActivityStatusChange }: ActivityKanbanBoardProps) {
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<StatusColumn[]>([
    { id: 1, name: "Por iniciar", activities: [], color: "bg-slate-200" },
    { id: 2, name: "En progreso", activities: [], color: "bg-blue-200" },
    { id: 3, name: "Completada", activities: [], color: "bg-green-200" },
    { id: 4, name: "Cancelada", activities: [], color: "bg-red-200" },
  ]);
  const [openActivityForm, setOpenActivityForm] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);
  const [draggingActivity, setDraggingActivity] = useState<Activity | null>(null);
  const [targetColumnId, setTargetColumnId] = useState<number | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<number | null>(null);

  // Calcular el total de actividades y las completadas
  const { totalActivities, completedActivities, progressPercentage } = useMemo(() => {
    const total = columns.reduce((total, column) => total + column.activities.length, 0);
    // Las actividades completadas son las que están en la columna "Completada" (id: 3)
    const completed = columns.find(col => col.id === 3)?.activities.length || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { totalActivities: total, completedActivities: completed, progressPercentage: percentage };
  }, [columns]);

  // Cargar las actividades de la categoría
  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Llamada a la API real para obtener las actividades
      const response = await fetch(`/api/projects/${projectId}/categories/${categoryId}/activities`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Error al cargar las actividades");
      }
      
      const activities: Activity[] = await response.json();
    
    // Filtrar actividades eliminadas
    const activeActivities = activities.filter(activity => !activity.isDeleted);
    
    // Distribuir las actividades en las columnas según su estado
    const newColumns = [...columns];
    newColumns.forEach(column => {
      column.activities = activeActivities.filter(
        activity => activity.projectCategoryActivityStatusId === column.id
      );
    });
      
      setColumns(newColumns);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Error al cargar las actividades de la categoría");
    } finally {
      setLoading(false);
    }
  };

  // Actualizar el estado de una actividad
  const updateActivityStatus = async (activityId: number, newStatusId: number) => {
    // Mostrar toast de carga
    const toastId = toast.loading("Actualizando estado...");
    
    try {
      // Guardar una referencia a la actividad que se está arrastrando
      const currentDraggingActivity = draggingActivity;
      if (!currentDraggingActivity) {
        throw new Error('No hay actividad seleccionada');
      }
      
      // Primero actualizar la UI para una experiencia más fluida
      setColumns(prevColumns => {
        const newColumns = JSON.parse(JSON.stringify(prevColumns)); // Copia profunda
        
        // Encontrar la columna de origen y quitar la actividad
        const sourceColumnIndex = newColumns.findIndex((col: StatusColumn) => 
          col.id === currentDraggingActivity.projectCategoryActivityStatusId
        );
        
        if (sourceColumnIndex !== -1) {
          newColumns[sourceColumnIndex].activities = newColumns[sourceColumnIndex].activities.filter(
            (activity: Activity) => activity.id !== activityId
          );
        }
        
        // Encontrar la columna de destino
        const targetColumnIndex = newColumns.findIndex((col: StatusColumn) => col.id === newStatusId);
        
        if (targetColumnIndex !== -1) {
          // Crear una copia de la actividad con el nuevo estado
          const updatedActivity = {
            ...currentDraggingActivity,
            projectCategoryActivityStatusId: newStatusId
          };
          
          // Asegurarse de que la actividad no exista ya en la columna de destino
          const existingIndex = newColumns[targetColumnIndex].activities.findIndex(
            (activity: Activity) => activity.id === activityId
          );
          
          if (existingIndex !== -1) {
            // Si ya existe, actualizar en lugar de añadir
            newColumns[targetColumnIndex].activities[existingIndex] = updatedActivity;
          } else {
            // Si no existe, añadir
            newColumns[targetColumnIndex].activities.push(updatedActivity);
          }
        }
        
        return newColumns;
      });
      
      // Luego hacer la llamada a la API
      const token = getToken();
      const response = await fetch(`/api/projects/${projectId}/categories/${categoryId}/activities/${activityId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ statusId: newStatusId })
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar el estado');
      }
      
      // Notificar al componente padre que se ha actualizado una actividad
      // Hacerlo en un setTimeout para evitar actualizar durante el renderizado
      setTimeout(() => {
        if (onActivityStatusChange && currentDraggingActivity) {
          const updatedActivity = {
            ...currentDraggingActivity,
            projectCategoryActivityStatusId: newStatusId
          };
          onActivityStatusChange(updatedActivity, newStatusId);
        }
      }, 0);
      
      toast.success("Estado de la actividad actualizado", { id: toastId });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast.error("Error al actualizar el estado de la actividad", { id: toastId });
    }
  };

  // Manejar el inicio del arrastre de una actividad
  const handleDragStart = (activity: Activity) => {
    setDraggingActivity(activity);
  };

  // Manejar el soltar una actividad en una columna
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, statusId: number) => {
    e.preventDefault();
    
    if (draggingActivity && draggingActivity.projectCategoryActivityStatusId !== statusId) {
      updateActivityStatus(draggingActivity.id, statusId);
    }
    
    setDraggingActivity(null);
    setTargetColumnId(null);
  };

  // Manejar el evento de arrastrar sobre
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, statusId: number) => {
    e.preventDefault();
    if (draggingActivity && draggingActivity.projectCategoryActivityStatusId !== statusId) {
      setTargetColumnId(statusId);
    }
  };
  
  // Manejar el evento de salir del área de drop
  const handleDragLeave = () => {
    setTargetColumnId(null);
  };

  // Editar una actividad
  const handleEditActivity = (activity: Activity) => {
    // Primero establecer la actividad a editar
    setActivityToEdit(activity);
    // Luego abrir el modal después de un pequeño retraso
    setTimeout(() => {
      setOpenActivityForm(true);
    }, 50);
  };

  // Eliminar una actividad
  const handleDeleteActivity = async (activityId: number) => {
    // Mostrar toast de carga
    const toastId = toast.loading("Eliminando actividad...");
    
    try {
      // Realizar la llamada a la API real
      const response = await fetch(`/api/projects/${projectId}/categories/${categoryId}/activities/${activityId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json"
        },
      });
      
      if (!response.ok) {
        throw new Error("Error al eliminar la actividad");
      }
      
      // Actualizar la UI después de la eliminación exitosa
      const newColumns = [...columns];
      newColumns.forEach(column => {
        column.activities = column.activities.filter(a => a.id !== activityId);
      });
      
      setColumns(newColumns);
      toast.success("Actividad eliminada con éxito", { id: toastId });
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Error al eliminar la actividad", { id: toastId });
    }
  };

  useEffect(() => {
    if (categoryId) {
      fetchActivities();
    }
  }, [categoryId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Actividades</h3>
        <Button 
          size="sm" 
          onClick={() => {
            setActivityToEdit(null);
            setOpenActivityForm(true);
          }}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Añadir Actividad
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex">
          <div className={`grid ${showCancelled ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4 flex-grow`}>
            {columns.filter(column => showCancelled || column.id !== 4).map((column) => (
            <div
              key={column.id}
              className={`border rounded-md p-3 ${column.color} bg-opacity-20 transition-colors duration-200 ${targetColumnId === column.id ? 'border-2 border-primary/30' : ''}`}
              onDrop={(e) => handleDrop(e, column.id)}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">{column.name}</h4>
                <Badge variant="outline">{column.activities.length}</Badge>
              </div>
              
              <div className="space-y-3 min-h-[200px]">
                {column.activities.length > 0 ? (
                  column.activities.map((activity) => (
                    <Card 
                      key={activity.id}
                      className="relative group transition-colors duration-200 hover:border-primary/30"
                      draggable="true"
                      onDragStart={() => handleDragStart(activity)}
                    >
                      <div className="absolute top-2 left-2 opacity-30 group-hover:opacity-70 transition-opacity">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <CardContent className="p-3 pl-8">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-sm">{activity.name}</h3>
                          <div className="relative z-10">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent 
                                align="end" 
                                sideOffset={5}
                                className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-md"
                              >
                                <DropdownMenuItem 
                                  onClick={() => handleEditActivity(activity)}
                                  className="hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700"
                                >
                                  <Pencil className="h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <ConfirmationDialog
                                  question="¿Está seguro de que desea eliminar esta actividad?"
                                  onConfirm={() => handleDeleteActivity(activity.id)}
                                  trigger={
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <DropdownMenuItem 
                                        className="text-destructive focus:text-destructive-foreground dark:text-red-400 dark:focus:text-red-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700"
                                        onSelect={(e) => {
                                          e.preventDefault();
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Eliminar
                                      </DropdownMenuItem>
                                    </div>
                                  }
                                />
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        {activity.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                        
                        <div className="mt-2 space-y-1">
                          {activity.dateTentativeEnd && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span>
                                Fecha límite: {(() => {
                                  // Crear una nueva fecha usando el constructor con año, mes, día
                                  // Importante: al usar UTC evitamos problemas de zona horaria
                                  const date = new Date(activity.dateTentativeEnd);
                                  const day = date.getUTCDate().toString().padStart(2, '0');
                                  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                                  const year = date.getUTCFullYear();
                                  return `${day}/${month}/${year}`;
                                })()}
                              </span>
                            </div>
                          )}
                          
                          {activity.assignedTo && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <User className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span>{activity.assignedTo}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] border border-dashed rounded-md p-4">
                    <p className="text-sm text-muted-foreground text-center">
                      No hay actividades en esta columna
                    </p>
                    {column.id === 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          // Primero limpiar la actividad
                          setActivityToEdit(null);
                          // Luego abrir el modal después de un breve retraso
                          setTimeout(() => {
                            setOpenActivityForm(true);
                          }, 100);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Añadir
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
          
          {/* Botón acordeón lateral para mostrar/ocultar columna de canceladas */}
          <button 
            onClick={() => setShowCancelled(!showCancelled)}
            className="flex flex-col justify-center items-center ml-2 w-6 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200 relative group border border-gray-200 shadow-sm"
            aria-label={showCancelled ? "Ocultar actividades canceladas" : "Mostrar actividades canceladas"}
          >
            <div className="absolute inset-y-0 flex items-center justify-center w-full">
              <div className="flex flex-col items-center justify-center">
                <div className="text-xs font-medium text-gray-600 tracking-wide py-2" style={{ writingMode: 'vertical-lr' }}>Canceladas</div>
                <div className="mt-2">
                  {showCancelled ? (
                    <Triangle className="h-3 w-3 text-gray-500 transform -rotate-90 fill-current" />
                  ) : (
                    <Triangle className="h-3 w-3 text-gray-500 transform rotate-90 fill-current" />
                  )}
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Modal para añadir/editar actividades - siempre presente en el DOM */}
      <ActivityFormDialog
        open={openActivityForm}
        onOpenChange={(isOpen: boolean) => {
          // Primero actualizar el estado del modal
          setOpenActivityForm(isOpen);
          
          // Si se está cerrando el modal, limpiar la actividad después de un retraso mayor
          // para asegurar que la animación de cierre haya terminado completamente
          if (!isOpen) {
            setTimeout(() => {
              setActivityToEdit(null);
            }, 300);
          }
        }}
        categoryId={categoryId}
        projectId={projectId}
        activityToEdit={activityToEdit as any}
        onSuccess={() => {
          // Recargar actividades después de un breve retraso para asegurar que la BD se actualizó
          setTimeout(() => {
            fetchActivities();
          }, 100);
        }}
      />


      {/* Eliminado el resumen de progreso a petición del usuario */}
    </div>
  );
}
