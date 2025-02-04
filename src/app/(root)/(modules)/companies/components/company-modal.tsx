"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CompanyForm } from "./company-form";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import type { Company } from "@/types";

interface CompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Company | null;
  onSuccess: () => void;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResponse {
  error: string;
  details: ValidationError[];
}

type FieldTranslations = {
  [key: string]: string;
};

const fieldTranslations: FieldTranslations = {
  'companyName': 'Nombre de la empresa',
  'contactName': 'Nombre del contacto',
  'email': 'Correo electrónico',
  'phone': 'Teléfono',
  'street': 'Calle',
  'externalNumber': 'Número exterior',
  'neighborhood': 'Colonia',
  'postalCode': 'Código postal',
  'city': 'Ciudad',
  'stateId': 'Estado',
};

export function CompanyModal({
  open,
  onOpenChange,
  item,
  onSuccess,
}: CompanyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);

      const url = item ? `/api/companies/${item.id}` : "/api/companies";
      const method = item ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if ('details' in data && Array.isArray(data.details)) {
          const validationResponse = data as ValidationResponse;
          // Solo mostramos el toast con los errores
          const messages = validationResponse.details.map((err) => {
            const fieldName = fieldTranslations[err.field] || err.field;
            return `${fieldName}: ${err.message}`;
          });
          toast.error(messages.join('\n'), {
            duration: 5000,
          });
          return;
        }
        // Error general
        toast.error(data.error || "Error al guardar el asociado", {
          duration: 5000,
        });
        return;
      }

      toast.success(
        item
          ? "Asociado actualizado correctamente"
          : "Asociado creado correctamente"
      );
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al guardar el asociado. Por favor, intenta de nuevo.", {
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Editar" : "Nuevo"} Asociado</DialogTitle>
        </DialogHeader>
        <CompanyForm
          initialData={item || undefined}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
