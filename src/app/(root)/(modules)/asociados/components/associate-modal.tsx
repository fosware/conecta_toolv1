"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type Associate } from "@/lib/schemas/associate";
import { AssociateForm, type AssociateFormData } from "./associate-form";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";
import { useState } from "react";

interface AssociateModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Associate | null;
}

export function AssociateModal({
  title,
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: AssociateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: AssociateFormData) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const url = `/api/asociados${initialData ? `/${initialData.id}` : ""}`;
      const method = initialData ? "PUT" : "POST";

      const formData = new FormData();

      // Agregar campos al FormData manteniendo los valores existentes
      formData.append("companyName", data.companyName || initialData?.companyName || "");
      formData.append("contactName", data.contactName || initialData?.contactName || "");
      formData.append("street", data.street || initialData?.street || "");
      formData.append("externalNumber", data.externalNumber || initialData?.externalNumber || "");
      formData.append("neighborhood", data.neighborhood || initialData?.neighborhood || "");
      formData.append("postalCode", data.postalCode || initialData?.postalCode || "");
      formData.append("city", data.city || initialData?.city || "");
      formData.append("stateId", (data.stateId || initialData?.stateId || 0).toString());
      formData.append("phone", data.phone || initialData?.phone || "");
      formData.append("email", data.email || initialData?.email || "");
      formData.append("machineCount", (data.machineCount || initialData?.machineCount || 0).toString());
      formData.append("employeeCount", (data.employeeCount || initialData?.employeeCount || 0).toString());
      formData.append("shifts", data.shifts || initialData?.shifts || "");

      // Campos opcionales
      if (data.internalNumber || initialData?.internalNumber) {
        formData.append("internalNumber", data.internalNumber || initialData?.internalNumber || "");
      }
      if (data.achievementDescription || initialData?.achievementDescription) {
        formData.append("achievementDescription", data.achievementDescription || initialData?.achievementDescription || "");
      }
      if (data.profile || initialData?.profile) {
        formData.append("profile", data.profile || initialData?.profile || "");
      }

      // Archivos
      if (data.nda instanceof File) {
        formData.append("nda", data.nda);
      }
      if (data.companyLogo instanceof File) {
        formData.append("companyLogo", data.companyLogo);
      } else if (typeof data.companyLogo === "string" && data.companyLogo) {
        formData.append("companyLogo", data.companyLogo);
      } else if (initialData?.companyLogo) {
        formData.append("companyLogo", initialData.companyLogo);
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error) {
          throw new Error(errorData.error);
        } else if (Array.isArray(errorData)) {
          throw new Error(errorData.map(err => err.message).join('\n'));
        } else {
          throw new Error("Error al guardar el asociado");
        }
      }

      toast.success(
        `Asociado ${initialData ? "actualizado" : "creado"} correctamente`
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al guardar asociado:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al guardar el asociado"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {initialData && (() => {
          console.log('Datos iniciales en el modal:', initialData);
          return null;
        })()}
        <AssociateForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
