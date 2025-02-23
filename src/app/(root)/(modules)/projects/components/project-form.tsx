"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { getToken } from "@/lib/auth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Client, ClientArea, Project, ProjectType } from "@/types";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

interface ProjectFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  onClose: () => void;
  initialData?: Project;
}

const formSchema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido" }),
  clientId: z.coerce.number().min(1, { message: "El cliente es requerido" }),
  clientAreaId: z.coerce.number().min(1, { message: "El área es requerida" }),
  projectTypeId: z.coerce.number().min(1, { message: "El tipo de proyecto es requerido" }),
  specialRequest: z.boolean().default(false),
  descriptionSpecialRequest: z.string().default(""),
  generalDescription: z.string().default(""),
  drawRequest: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ProjectForm({
  onSubmit,
  onClose,
  initialData,
}: ProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasSpecialRequest, setHasSpecialRequest] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientAreas, setClientAreas] = useState<ClientArea[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      clientId: initialData?.clientId || 0,
      clientAreaId: initialData?.clientAreaId || 0,
      projectTypeId: initialData?.projectTypeId || 0,
      specialRequest: initialData?.specialRequest || false,
      descriptionSpecialRequest: initialData?.descriptionSpecialRequest || "",
      generalDescription: initialData?.generalDescription || "",
    },
  });

  useEffect(() => {
    loadProjectTypes();
    loadClients();
    if (initialData?.clientId) {
      loadClientAreas(initialData.clientId);
    }
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        clientId: initialData.clientId,
        clientAreaId: initialData.clientAreaId,
        projectTypeId: initialData.projectTypeId,
        specialRequest: initialData.specialRequest ?? false,
        descriptionSpecialRequest: initialData.descriptionSpecialRequest || "",
        generalDescription: initialData.generalDescription || "",
      });
      setHasSpecialRequest(initialData.specialRequest ?? false);
    } else {
      form.reset({
        name: "",
        clientId: 0,
        clientAreaId: 0,
        projectTypeId: 0,
        specialRequest: false,
        descriptionSpecialRequest: "",
        generalDescription: "",
      });
      setHasSpecialRequest(false);
    }
  }, [initialData, form]);

  const loadProjectTypes = async () => {
    try {
      const response = await fetch("/api/cat_project_types", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al cargar los tipos de proyectos");
      }
      const data = await response.json();
      const items = Array.isArray(data) ? data : data.items || [];
      setProjectTypes(items);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al cargar los tipos de proyectos"
      );
      setProjectTypes([]);
    }
  };

  const loadClients = async () => {
    try {
      const response = await fetch("/api/clients?onlyActive=true", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al cargar los clientes");
      }
      const data = await response.json();
      const items = data.clients || [];
      setClients(items);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al cargar los clientes"
      );
      setClients([]);
    }
  };

  const loadClientAreas = async (clientId: number) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/areas`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al cargar las áreas");
      }
      const data = await response.json();
      const items = Array.isArray(data) ? data : data.items || [];
      setClientAreas(items);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al cargar las áreas"
      );
      setClientAreas([]);
    }
  };

  const onSubmitForm = async (data: FormValues) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      
      // Agregar campos del formulario
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== 'drawRequest') {
          formData.append(key, String(value));
        }
      });

      // Agregar archivo si existe
      const drawRequest = data.drawRequest?.[0];
      if (drawRequest) {
        formData.append("drawRequest", drawRequest);
        formData.append("nameDrawRequest", drawRequest.name);
      }

      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Error al guardar el proyecto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("drawRequest", e.target.files as FileList);
      
      // Crear preview si es un archivo de imagen
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewFile(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewFile(null);
      }
    }
  };

  return (
    <FormProvider {...form}>
      <div className="flex flex-col h-[calc(100vh-200px)]">
        <form onSubmit={form.handleSubmit(onSubmitForm)} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto space-y-4 pr-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del proyecto</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del proyecto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <FormControl>
                    <Select
                      disabled={form.formState.isSubmitting}
                      onValueChange={(value) => {
                        console.log("Select value changed to:", value);
                        field.onChange(Number(value));
                        loadClientAreas(Number(value));
                      }}
                      value={String(field.value || "")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => {
                          console.log("Rendering client option:", client.id, client.name);
                          return (
                            <SelectItem key={client.id} value={String(client.id)}>
                              {client.name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientAreaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área del cliente</FormLabel>
                  <Select
                    disabled={form.formState.isSubmitting}
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={String(field.value || "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar área" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientAreas.map((area) => (
                        <SelectItem key={area.id} value={String(area.id)}>
                          {area.areaName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de proyecto</FormLabel>
                  <Select
                    disabled={form.formState.isSubmitting}
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={String(field.value || "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialRequest"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setHasSpecialRequest(checked as boolean);
                      }}
                    />
                  </FormControl>
                  <FormLabel>Proyecto con requerimiento especial</FormLabel>
                </FormItem>
              )}
            />

            {hasSpecialRequest && (
              <FormField
                control={form.control}
                name="descriptionSpecialRequest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción de requerimiento especial</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Descripción de la solicitud especial"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="generalDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción general de la petición</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descripción general del proyecto"
                      className="resize-none"
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Archivo de petición</FormLabel>
              <div className="flex flex-col items-start gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {previewFile ? "Cambiar archivo" : "Subir archivo"}
                  </Button>
                  {form.watch("drawRequest")?.[0]?.name && (
                    <span className="text-sm text-gray-500">
                      {form.watch("drawRequest")?.[0]?.name || ""}
                    </span>
                  )}
                  {initialData?.drawRequest && initialData?.nameDrawRequest && (
                    <Link
                      href={`/api/projects/${initialData.id}/draw-request`}
                      target="_blank"
                      className="text-sm text-blue-500 hover:text-blue-700"
                    >
                      {initialData.nameDrawRequest}
                    </Link>
                  )}
                </div>
                {previewFile && (
                  <div className="relative w-32 h-32">
                    <Image
                      src={previewFile}
                      alt="Preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 mt-auto border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
