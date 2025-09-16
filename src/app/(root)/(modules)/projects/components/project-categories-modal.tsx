"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { createSystemLog } from "@/app/(root)/(modules)/project_logs/utils/create-system-log";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectCategory {
  id: number;
  name: string;
  description: string | null;
  projectId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProjectCategoriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  projectTitle: string;
  requirementName?: string; // Nombre del requerimiento (opcional)
  associateName?: string; // Nombre del asociado (opcional)
  onSuccess?: () => void; // Callback para actualización optimista
}

export function ProjectCategoriesModal({
  open,
  onOpenChange,
  projectId,
  projectTitle,
  requirementName,
  associateName,
  onSuccess,
}: ProjectCategoriesModalProps) {
  // Estados para el formulario
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ field: string; message: string }[]>([]);
  
  // Estados para la tabla
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para eliminar
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ProjectCategory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Estado para edición
  const [editingCategory, setEditingCategory] = useState<ProjectCategory | null>(null);

  // Ordenar las categorías por fecha de creación (ascendente)
  const sortCategoriesByCreationDate = (categories: ProjectCategory[]) => {
    return [...categories].sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  };
  
  // Cargar las categorías del proyecto
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/categories`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar las categorías");
      }

      const data = await response.json();
      // Ordenar las categorías por fecha de creación (ascendente - de más antiguas a más recientes)
      setCategories(sortCategoriesByCreationDate(data));
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Error al cargar las categorías del proyecto");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCategories();
      resetForm();
    }
  }, [open, projectId]);

  // Resetear el formulario
  const resetForm = () => {
    setCategoryName("");
    setCategoryDescription("");
    setEditingCategory(null);
    setValidationErrors([]);
  };

  // Manejar la edición de una categoría
  const handleEditCategory = (category: ProjectCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || "");
  };

  // Manejar la eliminación de una categoría
  const handleDeleteCategory = (category: ProjectCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  // Confirmar la eliminación de una categoría
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      setDeleteLoading(true);
      const response = await fetch(
        `/api/projects/${projectId}/categories/${categoryToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Error al eliminar la categoría");
        return;
      }

      toast.success("Categoría eliminada correctamente");
      
      // Crear log automático del sistema para la eliminación
      createSystemLog(
        projectId,
        `Se ha eliminado la categoría: "${categoryToDelete.name}"`
      );
      
      fetchCategories();
      
      // Llamar al callback de éxito para actualización optimista
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Error al eliminar la categoría");
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setValidationErrors([]);
      
      if (!categoryName.trim()) {
        setValidationErrors([{ field: "name", message: "El nombre es obligatorio" }]);
        return;
      }
      
      const method = editingCategory ? "PUT" : "POST";
      const url = editingCategory 
        ? `/api/projects/${projectId}/categories/${editingCategory.id}` 
        : `/api/projects/${projectId}/categories`;
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: categoryName,
          description: categoryDescription || undefined,
          projectId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.type === "VALIDATION_ERROR") {
          setValidationErrors(data.fields);
          return;
        }
        // Mostrar toast de error y salir de la función
        toast.error(data.error || "Error al guardar la categoría");
        return;
      }

      toast.success(
        editingCategory 
          ? "Categoría actualizada exitosamente" 
          : "Categoría creada exitosamente"
      );
      
      // Crear log automático del sistema
      createSystemLog(
        projectId,
        editingCategory
          ? `Se ha actualizado la categoría: "${categoryName}"`
          : `Se ha creado una nueva categoría: "${categoryName}"`
      );
      
      resetForm();
      fetchCategories();
      
      // Llamar al callback de éxito para actualización optimista
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(error instanceof Error ? error.message : "Error al guardar la categoría");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Categorías del Proyecto: <span className="font-bold">{projectTitle}</span></DialogTitle>
            {requirementName && (
              <p className="text-base mt-2">Requerimiento: <span className="font-bold">{requirementName}</span></p>
            )}
            {associateName && (
              <p className="text-base mt-2">Asociado: <span className="font-bold">{associateName}</span></p>
            )}
          </DialogHeader>
          
          {/* Formulario de categoría */}
          <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-md">
            <h3 className="text-lg font-medium">
              {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="categoryName"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Ej: Desarrollo, Diseño, Pruebas"
                  className={validationErrors.some(e => e.field === "name") ? "border-destructive" : ""}
                />
                {validationErrors.some(e => e.field === "name") && (
                  <p className="text-sm text-destructive">
                    {validationErrors.find(e => e.field === "name")?.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="categoryDescription">Descripción</Label>
                <Textarea
                  id="categoryDescription"
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  placeholder="Descripción detallada de la categoría"
                  className="min-h-[80px]"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              {editingCategory && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Cancelar Edición
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingCategory ? "Actualizando..." : "Guardando..."}
                  </>
                ) : (
                  editingCategory ? "Actualizar Categoría" : "Agregar Categoría"
                )}
              </Button>
            </div>
          </form>
          
          {/* Tabla de categorías */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Categorías Existentes</h3>
            
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay categorías para este proyecto. Crea una nueva categoría utilizando el formulario.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">#</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category, index) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium text-center">{index + 1}</TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description || "Sin descripción"}</TableCell>
                        <TableCell className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                            title="Editar categoría"
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteCategory(category)}
                            title="Eliminar categoría"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la categoría "{categoryToDelete?.name}" y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteCategory();
              }}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
