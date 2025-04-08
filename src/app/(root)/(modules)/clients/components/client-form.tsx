"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  type Client,
  type ClientCreate,
  clientCreateSchema,
} from "@/lib/schemas/client";
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
import { Loader2 } from "lucide-react";

interface ClientFormProps {
  initialData?: Client;
  onSubmit: (data: ClientCreate) => Promise<void>;
  isSubmitting?: boolean;
}

const ClientForm = ({
  initialData,
  onSubmit,
  isSubmitting = false,
}: ClientFormProps) => {
  const form = useForm<ClientCreate>({
    resolver: zodResolver(clientCreateSchema),
    defaultValues: {
      name: initialData?.name || "",
      registered_address: initialData?.registered_address || "",
      rfc: initialData?.rfc || "",
    },
  });

  const handleSubmit = async (data: ClientCreate) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      // El error se maneja en el componente padre
      console.error("Error en el formulario:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la empresa</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ingrese el nombre de la empresa"
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
          name="rfc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RFC</FormLabel>
              <FormControl>
                <Input
                  {...form.register("rfc")}
                  placeholder="RFC"
                  maxLength={13}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                    form.register("rfc").onChange(e);
                  }}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="registered_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección fiscal</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ingrese la dirección fiscal"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Guardar cambios" : "Crear cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ClientForm;
