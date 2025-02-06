"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { staffSchema, type StaffFormData } from "@/lib/validations/staff";
import { StaffMember } from "@/types/staff";
import { getToken } from "@/lib/auth";

interface AddStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: number;
  staff?: StaffMember;
  onSuccess?: () => void;
}

export function AddStaffModal({
  open,
  onOpenChange,
  companyId,
  staff,
  onSuccess,
}: AddStaffModalProps) {
  const router = useRouter();
  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      first_lastname: "",
      second_lastname: "",
      email: "",
      username: "",
      phone: "",
      role: "",
    },
  });

  useEffect(() => {
    if (staff) {
      form.reset({
        name: staff.user.name,
        first_lastname: staff.user.profile?.first_lastname || "",
        second_lastname: staff.user.profile?.second_lastname || "",
        email: staff.user.email,
        username: staff.user.username,
        phone: staff.user.profile?.phone || "",
        role: staff.role,
        staff: {
          userId: staff.userId,
          companyId: staff.companyId,
          role: staff.role,
        },
      });
    }
  }, [staff, form]);

  const onSubmit = async (data: StaffFormData) => {
    try {
      const token = getToken();
      if (!token) {
        toast.error("No autorizado - Por favor inicie sesión nuevamente");
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/companies/${companyId}/staff${staff ? `/${staff.id}` : ""}`, {
        method: staff ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("No autorizado - Por favor inicie sesión nuevamente");
          router.push("/login");
          return;
        }
        // Manejo específico para errores de validación
        if (response.status === 400) {
          toast.error(responseData.error);
          return;
        }
        throw new Error(responseData.error || "Error al guardar el miembro del personal");
      }

      if (responseData.emailSent === false) {
        toast.warning(
          "Personal guardado, pero hubo un error al enviar el correo de bienvenida"
        );
      } else {
        toast.success(staff ? "Personal actualizado correctamente" : "Personal guardado correctamente");
      }

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Solo mostrar errores no controlados en la consola
      console.error("Error saving staff:", error);
      // Mostrar mensaje genérico al usuario
      toast.error("Error al guardar los datos");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {staff ? "Editar Personal" : "Agregar Personal"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="first_lastname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido Paterno</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="second_lastname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido Materno</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puesto en la empresa</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Gerente, Supervisor, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {staff ? "Actualizar" : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
