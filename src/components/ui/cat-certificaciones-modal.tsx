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
  onSuccess,
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

  const handleFormSubmit = async (data: catCertificationsFormData) => {
    console.log("DATA", data);

    try {
      const endpoint =
        mode === "edit" && initialData?.id
          ? `/cat_certificaciones/api/${initialData.id}`
          : "/cat_certificaciones/api";

      console.log("ENDPOINT", endpoint);

      const method = mode === "edit" ? "PATCH" : "POST";

      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const res = await fetch(endpoint, {
        method,
        body: formData,
      });

      if (!res.ok) {
        const ewrrorData = await res.json();
        toast.error(ewrrorData.message || "Error al procesar la solicitud.");
        console.warn("Error del servidor:", ewrrorData.message);
        return;
      }

      toast.success(
        mode === "edit"
          ? "Datos actualizados correctamente."
          : "Datos guardados correctamente."
      );
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        mode === "edit"
          ? "Error al actualizar los datos."
          : "Error al guardar los datos."
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className=" bg-card dark:bg-card-dark border border-border dark:border-border-dark">
        <DialogHeader>
          <DialogTitle>Registro de Certificaciones</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                {...register("name")}
                className="col-span-3"
                type="text"
              />
              {errors.name && (
                <p className="text-red-600">{errors.name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descripcion
              </Label>
              <Input
                id="description"
                {...register("description")}
                className="col-span-3"
                type="text"
              />
              {errors.description && (
                <p className="text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>
          {/* Footer */}
          <DialogFooter className="col-span-full flex justify-between">
            <Button
              className="bg-transparent hover:text-white"
              type="button"
              onClick={onClose}
            >
              Cerrar
            </Button>
            <Button type="submit" className="bg-transparent hover:text-white">
              {mode === "edit" ? "Actualizar" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
