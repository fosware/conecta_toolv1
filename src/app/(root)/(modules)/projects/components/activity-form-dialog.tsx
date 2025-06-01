"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ActivityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: number;
  projectId: number;
  activityToEdit?: {
    id?: number;
    name?: string;
    description?: string;
    dateTentativeStart?: string | null;
    dateTentativeEnd?: string | null;
    observations?: string | null;
  } | null;
  onSuccess?: () => void;
}

interface ProjectCategoryActivity {
  id: number;
  name: string;
  description: string | null;
  projectCategoryId: number;
  projectCategoryActivityStatusId: number;
  dateTentativeStart: string | null;
  dateTentativeEnd: string | null;
  observations: string | null;
}

export function ActivityFormDialog({
  open,
  onOpenChange,
  categoryId,
  projectId,
  activityToEdit,
  onSuccess,
}: ActivityFormDialogProps) {
  // Usar useRef para evitar re-renders innecesarios
  const formRef = useRef<HTMLFormElement>(null);
  const initialRender = useRef(true);
  
  // Estados simples para reducir complejidad
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dateTentativeStart, setDateTentativeStart] = useState("");
  const [dateTentativeEnd, setDateTentativeEnd] = useState("");
  const [observations, setObservations] = useState("");
  const [loading, setLoading] = useState(false);

  // Determinar si estamos editando o creando
  const isEditing = !!activityToEdit;

  // Función para formatear fechas para inputs
  function formatDateForInput(dateString: string | null | undefined): string {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    } catch (e) {
      console.error("Error al formatear fecha:", e);
      return "";
    }
  }
  
  // Resetear el formulario
  const resetForm = () => {
    setName("");
    setDescription("");
    setDateTentativeStart("");
    setDateTentativeEnd("");
    setObservations("");
  };

  // Inicializar el formulario cuando cambia activityToEdit o se abre el modal
  useEffect(() => {
    if (open) {
      if (activityToEdit) {
        // Si estamos editando, establecer los valores del formulario
        setName(activityToEdit.name || "");
        setDescription(activityToEdit.description || "");
        setDateTentativeStart(formatDateForInput(activityToEdit.dateTentativeStart));
        setDateTentativeEnd(formatDateForInput(activityToEdit.dateTentativeEnd));
        setObservations(activityToEdit.observations || "");
      } else if (!initialRender.current) {
        // Solo resetear si no es el render inicial y no estamos editando
        resetForm();
      }
    }
    
    // Marcar que ya no es el render inicial
    initialRender.current = false;
  }, [activityToEdit, open]);

  // Función para cerrar el modal de forma segura
  const handleClose = () => {
    if (loading) return;
    
    // Usar setTimeout para evitar problemas de estado durante la transición
    setTimeout(() => {
      onOpenChange(false);
    }, 50); // Pequeño retraso para evitar problemas de transición
  };

  // Función para enviar el formulario
  const handleSubmit = async (e?: React.FormEvent) => {
    // Prevenir comportamiento por defecto si es un evento
    if (e) e.preventDefault();
    
    if (loading) return;
    
    // Validar campos obligatorios
    if (!name.trim()) {
      toast.error("El nombre de la actividad es obligatorio");
      return;
    }
    
    if (!dateTentativeStart) {
      toast.error("La fecha tentativa de inicio es obligatoria");
      return;
    }
    
    if (!dateTentativeEnd) {
      toast.error("La fecha tentativa de finalización es obligatoria");
      return;
    }

    try {
      setLoading(true);

      const url = `/api/projects/${projectId}/categories/${categoryId}/activities${
        isEditing && activityToEdit?.id ? `/${activityToEdit.id}` : ""
      }`;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name,
          description,
          dateTentativeStart: dateTentativeStart || null,
          dateTentativeEnd: dateTentativeEnd || null,
          observations,
          projectCategoryId: categoryId,
          projectCategoryActivityStatusId: isEditing ? undefined : 1, // Por comenzar (solo para nuevas actividades)
        }),
      });

      if (!response.ok) {
        throw new Error(`Error al ${isEditing ? "actualizar" : "crear"} la actividad`);
      }

      toast.success(`Actividad ${isEditing ? "actualizada" : "creada"} correctamente`);

      // Primero resetear el formulario
      resetForm();
      
      // Luego notificar éxito si hay callback
      if (onSuccess) {
        onSuccess();
      }
      
      // Finalmente cerrar el modal con un pequeño retraso
      setTimeout(() => {
        onOpenChange(false);
      }, 50);
      
    } catch (error) {
      console.error("Error:", error);
      toast.error(`Error al ${isEditing ? "actualizar" : "crear"} la actividad`);
    } finally {
      setLoading(false);
    }
  };

  // Resetear el formulario cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      // Esperar a que termine la animación de cierre antes de resetear
      const timer = setTimeout(() => {
        resetForm();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [open]);
  
  // Prevenir efectos secundarios durante la animación
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      handleClose();
    } else if (newOpen) {
      onOpenChange(true);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar" : "Crear"} Actividad
          </DialogTitle>
        </DialogHeader>
        
        <form 
          ref={formRef} 
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre de la Actividad*</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                placeholder="Ingrese el nombre de la actividad"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                placeholder="Descripción de la actividad"
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dateTentativeStart">
                  Fecha Tentativa de Inicio*
                </Label>
                <Input
                  id="dateTentativeStart"
                  type="date"
                  value={dateTentativeStart}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    setDateTentativeStart(newStartDate);
                    
                    // Si hay fecha fin y es anterior a la nueva fecha inicio, limpiarla
                    if (dateTentativeEnd && dateTentativeEnd < newStartDate) {
                      setDateTentativeEnd("");
                    }
                  }}
                  disabled={loading}
                  className="w-full"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dateTentativeEnd">
                  Fecha Tentativa de Finalización*
                </Label>
                <Input
                  id="dateTentativeEnd"
                  type="date"
                  value={dateTentativeEnd}
                  onChange={(e) => setDateTentativeEnd(e.target.value)}
                  min={dateTentativeStart} // Evita seleccionar fechas anteriores a la de inicio
                  disabled={loading || !dateTentativeStart}
                  className="w-full"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea
                id="observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                disabled={loading}
                placeholder="Observaciones adicionales"
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim() || !dateTentativeStart || !dateTentativeEnd}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Actualizar" : "Crear"} Actividad
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
