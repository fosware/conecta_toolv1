"use client";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Associate } from "@/lib/schemas/associate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { associateCreateSchema } from "@/lib/schemas/associate";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { LocationSelector } from "@/components/location-selector";
import { showToast } from "@/components/ui/custom-toast";
import Image from 'next/image';

export type AssociateFormData = Associate;

interface AssociateFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Associate | null;
  isSubmitting?: boolean;
}

export function AssociateForm({ onSubmit, onCancel, initialData, isSubmitting = false }: AssociateFormProps) {
  const form = useForm<AssociateFormData>({
    resolver: zodResolver(associateCreateSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      street: "",
      externalNumber: "",
      internalNumber: "",
      neighborhood: "",
      postalCode: "",
      city: "",
      stateId: 0,
      phone: "",
      email: "",
      machineCount: 0,
      employeeCount: 0,
      shifts: "",
      achievementDescription: "",
      profile: "",
      companyLogo: null,
      nda: null,
      isActive: true
    },
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      // Asegurarse de que todos los campos requeridos tengan valores válidos
      const formData = {
        companyName: initialData.companyName || "",
        contactName: initialData.contactName || "",
        street: initialData.street || "",
        externalNumber: initialData.externalNumber || "",
        internalNumber: initialData.internalNumber || "",
        neighborhood: initialData.neighborhood || "",
        postalCode: initialData.postalCode || "",
        city: initialData.city || "",
        stateId: initialData.stateId || 0,
        phone: initialData.phone || "",
        email: initialData.email || "",
        machineCount: initialData.machineCount || 0,
        employeeCount: initialData.employeeCount || 0,
        shifts: initialData.shifts || "",
        achievementDescription: initialData.achievementDescription || "",
        profile: initialData.profile || "",
        companyLogo: null,
        nda: null,
        isActive: initialData.isActive ?? true
      };

      form.reset(formData);
      
      if (initialData.companyLogo) {
        setLogoPreview(initialData.companyLogo);
      }
    }
  }, [initialData, form]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        form.setValue("companyLogo", file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const formData = new FormData();
      
      // Convertir números explícitamente
      formData.append("stateId", String(data.stateId));
      formData.append("machineCount", String(data.machineCount));
      formData.append("employeeCount", String(data.employeeCount));
      
      // Agregar campos de texto
      formData.append("companyName", data.companyName);
      formData.append("contactName", data.contactName);
      formData.append("street", data.street);
      formData.append("externalNumber", data.externalNumber);
      formData.append("internalNumber", data.internalNumber || "");
      formData.append("neighborhood", data.neighborhood);
      formData.append("postalCode", data.postalCode);
      formData.append("city", data.city);
      formData.append("phone", data.phone);
      formData.append("email", data.email);
      formData.append("shifts", data.shifts);
      formData.append("achievementDescription", data.achievementDescription || "");
      formData.append("profile", data.profile || "");
      
      // Manejar archivos
      if (data.nda instanceof File) {
        formData.append("nda", data.nda);
      }
      
      if (data.companyLogo instanceof File) {
        formData.append("companyLogo", data.companyLogo);
      } else if (typeof data.companyLogo === "string" && data.companyLogo) {
        formData.append("companyLogo", data.companyLogo);
      }
      
      await onSubmit(formData);
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      showToast("error", error instanceof Error ? error.message : "Error al guardar");
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo y datos principales */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="companyLogo"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Logo de la empresa</FormLabel>
                  <FormControl>
                    <div className="flex flex-col gap-4">
                      <div className="w-48 h-48 relative border rounded-lg overflow-hidden">
                        {logoPreview ? (
                          <Image
                            src={logoPreview}
                            alt="Logo"
                            fill
                            style={{ objectFit: "contain" }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <p className="text-gray-500 text-sm">Logo de la empresa</p>
                          </div>
                        )}
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        disabled={isSubmitting}
                        className="mt-2"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Información principal */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la empresa</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
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
                    <Input {...field} disabled={isSubmitting} />
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
                    <Input {...field} type="email" disabled={isSubmitting} />
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
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* NDA */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="nda"
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <FormItem>
                <FormLabel>NDA (PDF, máx. 5MB)</FormLabel>
                <div className="flex items-center gap-4">
                  <FormControl>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            showToast("error", "El archivo no debe exceder 5MB");
                            return;
                          }
                          if (!file.type.includes("pdf")) {
                            showToast("error", "El archivo debe ser un PDF");
                            return;
                          }
                          onChange(file);
                        }
                      }}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  {initialData?.ndaFileName && (
                    <div className="text-sm text-gray-500">
                      Archivo actual: {initialData.ndaFileName}
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Resto de campos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Calle</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="externalNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número exterior</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="internalNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número interior</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="neighborhood"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Colonia</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código postal</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <LocationSelector
                    value={Number(field.value)}
                    onChange={field.onChange}
                    error={form.formState.errors.stateId?.message}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="machineCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de máquinas</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min={0}
                    value={field.value || 0}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={isSubmitting} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employeeCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de empleados</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min={0}
                    value={field.value || 0}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={isSubmitting} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shifts"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Turnos</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="achievementDescription"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Descripción de logros</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value || ''} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profile"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Perfil</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value || ''} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => onCancel()} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </div>
      </form>
    </Form>
  );
}
