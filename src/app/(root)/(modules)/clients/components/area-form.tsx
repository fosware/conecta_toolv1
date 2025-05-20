import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { type ClientArea, clientAreaCreateSchema } from "@/lib/schemas/client";

// Función para formatear números telefónicos en el formato XX-XXXX-XXXX para visualización
const formatPhoneDisplay = (phone: string | null | undefined): string => {
  if (!phone) return "";
  
  // Eliminar cualquier caracter no numérico
  const cleaned = phone.replace(/\D/g, "");
  
  // Formatear de forma progresiva mientras el usuario escribe
  if (cleaned.length <= 2) {
    return cleaned;
  } else if (cleaned.length <= 6) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  } else {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`;
  }
};

interface AreaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ClientArea>) => Promise<void>;
  initialData?: ClientArea;
}

export const AreaForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: AreaFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Partial<ClientArea>>({
    resolver: zodResolver(clientAreaCreateSchema.omit({ clientId: true })),
    defaultValues: {
      areaName: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      observations: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          areaName: initialData.areaName,
          contactName: initialData.contactName,
          contactEmail: initialData.contactEmail,
          contactPhone: initialData.contactPhone,
          observations: initialData.observations || "",
        });
      } else {
        form.reset({
          areaName: "",
          contactName: "",
          contactEmail: "",
          contactPhone: "",
          observations: "",
        });
      }
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = async (data: Partial<ClientArea>) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      onClose();
    } catch (error) {
      // El error ya se maneja en el componente padre
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Contacto" : "Nuevo Contacto"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="areaName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Puesto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Puesto"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del contacto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre del contacto"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email del contacto</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email del contacto"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono del contacto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Teléfono del contacto"
                      disabled={isSubmitting}
                      maxLength={12} // Ajustado para el formato XX-XXXX-XXXX
                      value={formatPhoneDisplay(field.value)}
                      onChange={(e) => {
                        // Obtener la posición del cursor antes del cambio
                        const cursorPosition = e.target.selectionStart || 0;
                        
                        // Obtener el valor actual y el nuevo valor
                        const currentFormattedValue = formatPhoneDisplay(field.value);
                        const newRawValue = e.target.value;
                        
                        // Eliminar caracteres no numéricos para almacenamiento
                        const numericValue = newRawValue.replace(/[^0-9-]/g, "").replace(/-/g, "");
                        
                        // Limitar a 10 dígitos
                        if (numericValue.length <= 10) {
                          // Actualizar el valor en el formulario (solo números)
                          field.onChange(numericValue);
                          
                          // Calcular el ajuste de posición del cursor debido al formateo
                          // Si estamos agregando un guión, mover el cursor una posición adicional
                          setTimeout(() => {
                            // Determinar si se agregó un guión en la posición actual
                            const newFormattedValue = formatPhoneDisplay(numericValue);
                            const addedHyphen = 
                              (numericValue.length === 2 && currentFormattedValue.length < newFormattedValue.length) ||
                              (numericValue.length === 6 && currentFormattedValue.length < newFormattedValue.length);
                            
                            // Ajustar la posición del cursor si se agregó un guión
                            if (addedHyphen && e.target.selectionStart) {
                              e.target.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
                            }
                          }, 0);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observaciones"
                      {...field}
                      value={field.value || ""}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {initialData ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AreaForm;
