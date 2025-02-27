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
      terms_and_conditions: "",
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
          terms_and_conditions: initialData.terms_and_conditions || "",
        });
      } else {
        form.reset({
          areaName: "",
          contactName: "",
          contactEmail: "",
          contactPhone: "",
          terms_and_conditions: "",
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
            {initialData ? "Editar Área" : "Nueva Área"}
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
                  <FormLabel>Nombre del área</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre del área"
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
                      {...field}
                      disabled={isSubmitting}
                      maxLength={10}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms_and_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Términos y condiciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Términos y condiciones"
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
