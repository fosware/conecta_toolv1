import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  catCertificationsSchema,
  catCertificationsFormData,
} from "@/lib/schemas/cat_certifications";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/custom-toast";

interface CertificacionesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: catCertificationsFormData) => Promise<void>;
  initialData?: Partial<catCertificationsFormData>;
  mode: "edit" | "create";
  onSuccess?: () => Promise<void>;
}

export const CatCertificacionesModal = ({
  isOpen,
  onClose,
  onSubmit,
  onSuccess,
  initialData,
  mode,
}: CertificacionesModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<catCertificationsFormData>({
    resolver: zodResolver(catCertificationsSchema),
    defaultValues: initialData || {},
    mode: "onBlur",
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === "create") {
        reset({
          name: "",
          description: "",
          isActive: true,
        });
      } else if (mode === "edit" && initialData) {
        reset(initialData);
      }
    }
  }, [isOpen, mode, initialData, reset]);

  const handleFormSubmit = async (data: catCertificationsFormData) => {
    try {
      await onSubmit(data);
      showToast({
        message: mode === "edit"
          ? "Certificación actualizada correctamente"
          : "Certificación registrada correctamente",
        type: "success"
      });
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Error al procesar la solicitud:", error);
      showToast({
        message: "Error inesperado",
        type: "error"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card dark:bg-card-dark border border-border dark:border-border-dark">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Registrar Certificación"
              : "Editar Certificación"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {mode === "create" 
              ? "Complete los campos para registrar una nueva certificación"
              : "Modifique los campos que desea actualizar"}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" {...register("description")} />
            {errors.description && (
              <p className="text-red-600">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              className="border-primary hover:bg-primary hover:text-white"
              type="button"
              onClick={onClose}
            >
              Cerrar
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {mode === "edit" ? "Actualizar" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
