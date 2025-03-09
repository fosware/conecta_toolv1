"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProjectRequestForm } from "./project-request-form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { type ProjectRequestCreate } from "@/lib/schemas/project_request";
import { getToken } from "@/lib/auth";

interface ProjectRequest {
  id: number;
  title: string;
  observation: string | null;
  clientAreaId: number;
  isActive: boolean;
  requestDate?: string | Date;
}

interface ProjectRequestFormData {
  title: string;
  observation?: string;
  clientAreaId: number;
  requestDate?: string | Date;
}

interface ProjectRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ProjectRequest | null;
  onSuccess: () => void;
}

export function ProjectRequestModal({
  open,
  onOpenChange,
  item,
  onSuccess,
}: ProjectRequestModalProps) {
  const [validationErrors, setValidationErrors] = useState<{ field: string; message: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: ProjectRequestCreate) => {
    try {
      setIsSubmitting(true);
      const method = item ? "PUT" : "POST";
      const url = item ? `/api/project_requests/${item.id}` : "/api/project_requests";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.type === "VALIDATION_ERROR") {
          setValidationErrors(data.fields);
          return;
        }
        console.error("Error en la respuesta:", data);
        toast.error(data.error || "Error al guardar la solicitud de proyecto");
        return;
      }

      toast.success(
        item 
          ? "Solicitud de proyecto actualizada exitosamente" 
          : "Solicitud de proyecto creada exitosamente"
      );
      setValidationErrors([]);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving project request:", error);
      toast.error(error instanceof Error ? error.message : "Error al guardar la solicitud de proyecto");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setValidationErrors([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? "Editar Solicitud de Proyecto" : "Nueva Solicitud de Proyecto"}
          </DialogTitle>
        </DialogHeader>
        <ProjectRequestForm
          initialData={item ? {
            title: item.title,
            observation: item.observation || undefined,
            clientAreaId: item.clientAreaId,
            requestDate: item.requestDate ? new Date(item.requestDate) : new Date()
          } : undefined}
          onSubmit={handleSubmit}
          validationErrors={validationErrors}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
