"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { ProjectWithRelations } from "@/lib/schemas/project";

interface ProjectStatus {
  id: number;
  name: string;
  color: string | null;
}

interface ProjectEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectWithRelations | null;
  onSuccess?: () => void;
}

export function ProjectEditModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}: ProjectEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  const [formData, setFormData] = useState({
    projectStatusId: "",
    observations: "",
  });

  // Cargar los estados de proyecto disponibles
  useEffect(() => {
    const fetchProjectStatuses = async () => {
      try {
        const token = await getToken();
        const response = await fetch("/api/project-statuses", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al cargar los estados de proyecto");
        }

        const data = await response.json();
        setProjectStatuses(data);
      } catch (error) {
        console.error("Error fetching project statuses:", error);
        toast.error("Error al cargar los estados de proyecto");
      }
    };

    if (isOpen) {
      fetchProjectStatuses();
    }
  }, [isOpen]);

  // Inicializar el formulario con los datos del proyecto
  useEffect(() => {
    if (project) {
      setFormData({
        projectStatusId: project.projectStatusId.toString(),
        observations: project.observations || "",
      });
    }
  }, [project]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!project) return;
    
    setLoading(true);
    
    try {
      const token = await getToken();
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectStatusId: parseInt(formData.projectStatusId),
          observations: formData.observations,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el proyecto");
      }

      toast.success("Proyecto actualizado correctamente");
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Error al actualizar el proyecto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Proyecto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectStatusId">Estado del Proyecto</Label>
              <Select
                value={formData.projectStatusId}
                onValueChange={(value) => handleSelectChange("projectStatusId", value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {projectStatuses.map((status) => (
                    <SelectItem key={status.id} value={status.id.toString()}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea
                id="observations"
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                placeholder="Ingresa observaciones sobre el proyecto"
                disabled={loading}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
