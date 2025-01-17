import {
  catCertificationsSchema,
  catCertificationsFormData,
} from "@/lib/schemas/cat_certifications";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { toast } from "react-hot-toast";

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
  // onSuccess,
  initialData,
  mode,
}: CertificacionesModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    // setValue,
    formState: { errors },
  } = useForm<catCertificationsFormData>({
    resolver: zodResolver(catCertificationsSchema),
    defaultValues: initialData || {},
    mode: "onBlur",
  });

  useEffect(() => {
    console.log("initialData", initialData);
    if (isOpen) {
      if (mode === "create") {
        // Limpia el formulario para un nuevo usuario
        reset({
          name: "",
          description: "",
        });
      } else if (mode === "edit" && initialData) {
        // Llena el formulario con los datos del usuario a editar
        reset({ ...initialData });
      }
    }
  }, [isOpen, mode, initialData, reset]);

  const handleFormSubmit = async (formData: catCertificationsFormData) => {
    try {
      const dataToSubmit: catCertificationsFormData = {
        id: initialData?.id,
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive ?? true,
        isDeleted: false,
        userId: initialData?.userId,
        createdAt: initialData?.createdAt,
        updatedAt: new Date().toISOString(),
      };

      await onSubmit(dataToSubmit);
      onClose();
    } catch (error) {
      console.error("Error al procesar el formulario:", error);
      toast.error("Error al procesar el formulario");
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
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  {...register("name")}
                  className="w-full bg-background border-input"
                  type="text"
                />
                {errors.name && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descripción
              </Label>
              <div className="col-span-3">
                <Input
                  id="description"
                  {...register("description")}
                  className="w-full bg-background border-input"
                  type="text"
                />
                {errors.description && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Activo
              </Label>
              <div className="col-span-3">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register("isActive")}
                  className="toggle"
                  defaultChecked={true}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="default">
              {mode === "edit" ? "Actualizar" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
