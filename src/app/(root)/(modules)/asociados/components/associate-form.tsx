"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import Image from "next/image";
import Link from "next/link";

export type AssociateFormData = Omit<
  Associate,
  "isDeleted" | "dateDeleted" | "createdAt" | "updatedAt"
>;

interface AssociateFormProps {
  onSubmit: (data: AssociateFormData) => Promise<void>;
  onCancel: () => void;
  initialData?:
    | (AssociateFormData & {
        id?: number;
        locationState?: {
          id: number;
          name: string;
        };
      })
    | null;
  isSubmitting?: boolean;
}

export function AssociateForm({
  onSubmit,
  onCancel,
  initialData,
  isSubmitting = false,
}: AssociateFormProps) {
  const form = useForm<AssociateFormData>({
    resolver: zodResolver(associateCreateSchema),
    defaultValues: {
      id: initialData?.id,
      companyName: initialData?.companyName || "",
      contactName: initialData?.contactName || "",
      street: initialData?.street || "",
      externalNumber: initialData?.externalNumber || "",
      internalNumber: initialData?.internalNumber || "",
      neighborhood: initialData?.neighborhood || "",
      postalCode: initialData?.postalCode || "",
      city: initialData?.city || "",
      stateId: initialData?.stateId || initialData?.locationState?.id || 0,
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      machineCount: initialData?.machineCount || 0,
      employeeCount: initialData?.employeeCount || 0,
      shifts: initialData?.shifts || "",
      achievementDescription: initialData?.achievementDescription || "",
      profile: initialData?.profile || "",
      companyLogo: null,
      nda: null,
      isActive: initialData?.isActive ?? true,
      userId: initialData?.userId,
    },
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [ndaFile, setNdaFile] = useState<File | null>(null);

  useEffect(() => {
    if (initialData) {
      const formData = {
        id: initialData.id,
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
        isActive: initialData.isActive ?? true,
        userId: initialData.userId,
      };

      form.reset(formData);

      // Si hay un logo existente, mostrarlo
      if (initialData.companyLogo) {
        setLogoPreview(`data:image/jpeg;base64,${initialData.companyLogo}`);
      }
    }
  }, [initialData, form]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          const base64String = reader.result.split(",")[1];
          setLogoPreview(reader.result); // Mantenemos el data URL completo para el preview
          form.setValue("companyLogo", base64String); // Solo guardamos la parte base64
        }
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
      form.setValue("companyLogo", null);
    }
  };

  const handleNdaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNdaFile(file);
      form.setValue("nda", file);
    } else {
      setNdaFile(null);
      form.setValue("nda", null);
    }
  };

  const handleSubmit = form.handleSubmit((data) => onSubmit(data));

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
                            <p className="text-gray-500 text-sm">
                              Logo de la empresa
                            </p>
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
                <FormLabel>NDA File</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    id="nda"
                    onChange={handleNdaChange}
                    accept=".pdf"
                    disabled={isSubmitting}
                  />
                </FormControl>
                {initialData?.ndaFileName && (
                  <div className="text-sm text-muted-foreground mt-2">
                    Archivo actual:{" "}
                    <Link
                      href={`/api/asociados/${initialData.id}/nda`}
                      target="_blank"
                      className="text-primary hover:underline"
                    >
                      {initialData.ndaFileName}
                    </Link>
                  </div>
                )}
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
                  <Input
                    {...field}
                    value={field.value || ""}
                    disabled={isSubmitting}
                  />
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
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <LocationSelector
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
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
                  <Input
                    {...field}
                    value={field.value || ""}
                    disabled={isSubmitting}
                  />
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
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    disabled={isSubmitting}
                  />
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
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onCancel()}
            disabled={isSubmitting}
            className="border-border bg-background hover:bg-hover dark:border-muted dark:bg-hover dark:text-primary dark:hover:bg-background"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-button-text hover:bg-primary/90 dark:bg-accent dark:text-background dark:hover:bg-accent/90"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </div>
      </form>
    </Form>
  );
}
