import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CompanyForm } from "./company-form";
import { Company } from "@prisma/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface CompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Company | null;
  onSuccess: () => void;
}

export function CompanyModal({
  open,
  onOpenChange,
  item,
  onSuccess,
}: CompanyModalProps) {
  const [validationErrors, setValidationErrors] = useState<{ field: string; message: string }[]>([]);

  const handleSubmit = async (formData: FormData) => {
    try {
      const method = item ? "PUT" : "POST";
      const url = item ? `/api/companies/${item.id}` : "/api/companies";
      
      const response = await fetch(url, {
        method,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.type === "VALIDATION_ERROR") {
          setValidationErrors(data.fields);
          return;
        }
        throw new Error(data.error || "Error al guardar la empresa");
      }

      toast.success(item ? "Empresa actualizada exitosamente" : "Empresa creada exitosamente");
      setValidationErrors([]);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving company:", error);
      toast.error(error instanceof Error ? error.message : "Error al guardar la empresa");
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
            {item ? "Editar Asociado" : "Nuevo Asociado"}
          </DialogTitle>
        </DialogHeader>
        <CompanyForm
          initialData={item || undefined}
          onSubmit={handleSubmit}
          validationErrors={validationErrors}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
