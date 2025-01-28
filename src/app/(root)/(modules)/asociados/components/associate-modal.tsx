"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Associate } from "@/lib/schemas/associate";
import { AssociateForm, type AssociateFormData } from "./associate-form";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";
import { useState } from "react";

interface AssociateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: AssociateFormData & {
    id?: number;
    locationState?: {
      id: number;
      name: string;
    };
  };
  onSuccess?: (data: any) => void;
}

export const AssociateModal = ({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: AssociateModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ndaFile, setNdaFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNdaFile(file);
    }
  };

  const handleSubmit = async (data: AssociateFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Agregar todos los campos al FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'nda' && value instanceof File) {
            formData.append(key, value);
          } else if (key === 'companyLogo' && value) {
            formData.append(key, value.toString());
          } else if (typeof value === 'number') {
            formData.append(key, value.toString());
          } else {
            formData.append(key, value);
          }
        }
      });

      const url = `/api/asociados${initialData?.id ? `/${initialData.id}` : ""}`;
      const method = initialData?.id ? "PUT" : "POST";

      const token = await getToken();
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseText = await response.text();
      console.log('Response text:', responseText); // Para debug

      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error("Error parsing response:", responseText);
        throw new Error("Error al procesar la respuesta del servidor");
      }

      if (!response.ok) {
        if (responseData.details) {
          // Si hay errores de validación detallados, mostrar el primer error
          toast.error(responseData.details[0].message);
        } else {
          toast.error(responseData.error || "Error al guardar asociado");
        }
        return;
      }

      toast.success(
        `Asociado ${initialData?.id ? "actualizado" : "creado"} correctamente`
      );
      onSuccess?.(responseData.data);
      onClose();
    } catch (error) {
      console.error("Error al guardar asociado:", error);
      toast.error(error instanceof Error ? error.message : "Error al guardar asociado");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Asociado</DialogTitle>
        </DialogHeader>
        <AssociateForm
          onSubmit={handleSubmit}
          onCancel={onClose}
          initialData={initialData}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
