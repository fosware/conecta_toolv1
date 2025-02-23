"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectForm } from "./components/project-form";
import { ProjectsTable } from "./components/projects-table";
import { ProjectQuotesModal } from "./components/project-quotes-modal";
import { getToken } from "@/lib/auth";
import { useDebounce } from "@/hooks/use-debounce";
import { type Project } from "@/types";
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActive, setShowActive] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [open, setOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    item: Project | null;
  }>({
    isOpen: false,
    item: null,
  });
  const [isQuotesModalOpen, setIsQuotesModalOpen] = useState(false);
  const [selectedQuoteProject, setSelectedQuoteProject] = useState<Project | undefined>(undefined);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/projects", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los proyectos");
      }

      const data = await response.json();
      const filteredProjects = data.filter((p: Project) => {
        if (!debouncedSearch) return !showActive || p.isActive;
        
        const searchLower = debouncedSearch.toLowerCase();
        const searchMatches = [
          p.name,
          p.client?.name ?? '',
          p.clientArea?.areaName ?? '',
          p.projectType?.name ?? '',
        ]
          .map(value => (value || '').toLowerCase())
          .some(value => value.includes(searchLower));

        return searchMatches && (!showActive || p.isActive);
      });
      
      setProjects(filteredProjects);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar los proyectos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [debouncedSearch, showActive]);

  const handleToggleStatus = async (project: Project) => {
    try {
      const response = await fetch(`/api/projects/${project.id}/toggle-status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cambiar el estado del proyecto");
      }

      await loadProjects();
      toast.success("Estado del proyecto actualizado correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar el estado");
    }
  };

  const handleDelete = async (project: Project) => {
    setDeleteDialog({ isOpen: true, item: project });
  };

  const confirmDelete = async () => {
    const project = deleteDialog.item;
    if (!project) return;

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el proyecto");
      }

      await loadProjects();
      toast.success("Proyecto eliminado correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar el proyecto");
    } finally {
      setDeleteDialog({ isOpen: false, item: null });
    }
  };

  const handleProjectUpdate = async (id: number, currentStatus: boolean) => {
    // Actualización optimista
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id ? { ...project, isActive: !currentStatus } : project
      )
    );

    try {
      const response = await fetch(`/api/projects/${id}/toggle-status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar el estado");
      }

      toast.success(
        `Proyecto ${!currentStatus ? "habilitado" : "inhabilitado"} correctamente`
      );
    } catch (error) {
      // Rollback en caso de error
      setProjects((prev) =>
        prev.map((project) =>
          project.id === id ? { ...project, isActive: currentStatus } : project
        )
      );
      toast.error("Error al actualizar el estado del proyecto");
    }
  };

  const handleCreate = () => {
    setSelectedProject(undefined);
    setOpen(true);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setOpen(true);
  };

  const handleClose = () => {
    setSelectedProject(undefined);
    setOpen(false);
  };

  const handleQuotes = (project: Project) => {
    setSelectedQuoteProject(project);
    setIsQuotesModalOpen(true);
  };

  const handleQuotesClose = () => {
    setIsQuotesModalOpen(false);
    setSelectedQuoteProject(undefined);
  };

  const handleUpdate = async (formData: FormData) => {
    const projectId = selectedProject?.id;

    try {
      if (projectId) {
        // Update existing project
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Error al actualizar el proyecto");
        }

        const updatedProject = await response.json();
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? updatedProject : p))
        );
        toast.success("Proyecto actualizado correctamente");
      } else {
        // Create new project
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Error al crear el proyecto");
        }

        const newProject = await response.json();
        setProjects((prev) => [...prev, newProject]);
        toast.success("Proyecto creado correctamente");
      }

      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar el proyecto");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Proyectos</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo proyecto
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar proyectos..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <Switch
                id="show-active"
                checked={showActive}
                onCheckedChange={setShowActive}
              />
              <Label htmlFor="show-active">Mostrar solo activos</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProjectsTable
        projects={projects}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        onQuotes={handleQuotes}
      />

      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {selectedProject ? "Editar Proyecto" : "Nuevo Proyecto"}
              </DialogTitle>
            </DialogHeader>
            <ProjectForm
              onSubmit={handleUpdate}
              onClose={handleClose}
              initialData={selectedProject}
            />
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(isOpen) => 
        setDeleteDialog(prev => ({ ...prev, isOpen }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el proyecto
              {deleteDialog.item?.name && ` "${deleteDialog.item.name}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedQuoteProject && (
        <ProjectQuotesModal
          project={selectedQuoteProject}
          onClose={() => setSelectedQuoteProject(undefined)}
        />
      )}
    </div>
  );
}
