"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ProjectRequestForm as ProjectRequestFormType, 
  projectRequestFormSchema 
} from "@/lib/schemas/project-request";
import RequirementForm from "./requirement-form";

interface ClientArea {
  id: number;
  clientId: number;
  areaName: string;
  contactName: string;
  client: {
    id: number;
    name: string;
  };
}

interface ProjectRequestFormProps {
  onSuccess: () => void;
  onClose: () => void;
  initialData?: any; // Datos iniciales para edición
}

const ProjectRequestForm = ({ onSuccess, onClose, initialData }: ProjectRequestFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientAreas, setClientAreas] = useState<ClientArea[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(true);

  const form = useForm<ProjectRequestFormType>({
    resolver: zodResolver(projectRequestFormSchema),
    defaultValues: initialData || {
      title: "",
      clientAreaId: 0,
      details: [
        {
          name: "",
          certifications: [],
          specialties: [],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "details",
  });

  // Cargar áreas de clientes
  const loadClientAreas = async () => {
    setIsLoadingAreas(true);
    try {
      const response = await fetch("/api/clients/areas", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar las áreas de clientes");
      }

      const data = await response.json();
      setClientAreas(data.clientAreas || []);
      return data.clientAreas || [];
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar las áreas de clientes");
      return [];
    } finally {
      setIsLoadingAreas(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        const areas = await loadClientAreas();
        
        // Inicializar el primer requerimiento con datos por defecto
        if (isMounted && fields.length === 1 && !fields[0].name) {
          const defaultRequirement = {
            name: "",
            certifications: [],
            specialties: []
          };
          form.setValue("details", [defaultRequirement]);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Eliminar dependencias para evitar bucles infinitos

  // Efecto para cargar los datos iniciales cuando se edita
  useEffect(() => {
    if (initialData) {
      console.log("Cargando datos iniciales para edición:", {
        id: initialData.id,
        title: initialData.title,
        clientAreaId: initialData.clientAreaId,
        detailsCount: initialData.details?.length || 0,
        details: initialData.details?.map((d: any) => ({
          name: d.name,
          certCount: d.certifications?.length || 0,
          specCount: d.specialties?.length || 0
        }))
      });
      
      form.reset({
        title: initialData.title,
        clientAreaId: initialData.clientAreaId,
        details: initialData.details.map((detail: any) => ({
          name: detail.name,
          certifications: detail.certifications || [],
          specialties: detail.specialties || [],
          scopeId: detail.scopeId,
          subscopeId: detail.subscopeId,
        })),
      });
    }
  }, [initialData, form]);

  const handleSubmit = async (data: ProjectRequestFormType) => {
    setIsSubmitting(true);
    try {
      const url = initialData 
        ? `/api/project_request/${initialData.id}` 
        : "/api/project_request";
      
      const method = initialData ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error al ${initialData ? 'actualizar' : 'crear'} la solicitud`);
      }

      toast.success(`Solicitud de proyecto ${initialData ? 'actualizada' : 'creada'} correctamente`);
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || `Error al ${initialData ? 'actualizar' : 'crear'} la solicitud`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addRequirement = () => {
    // Verificar que el último requerimiento tenga al menos un nombre
    const lastIndex = fields.length - 1;
    const lastRequirement = form.getValues(`details.${lastIndex}`);
    
    if (!lastRequirement.name.trim()) {
      toast.error("Debe completar al menos el nombre del requerimiento actual antes de agregar uno nuevo");
      return;
    }
    
    append({
      name: "",
      certifications: [],
      specialties: [],
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título de la solicitud</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ingrese el título de la solicitud"
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
            name="clientAreaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área del cliente</FormLabel>
                <Select
                  disabled={isLoadingAreas || isSubmitting}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value ? field.value.toString() : ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar área del cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clientAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id.toString()}>
                        {area.client.name} - {area.areaName} - {area.contactName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Requerimientos</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRequirement}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar requerimiento
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id} className="border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-md font-medium">
                  Requerimiento {index + 1}
                </CardTitle>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name={`details.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del requerimiento</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ingrese el nombre del requerimiento"
                          {...field}
                          disabled={isSubmitting}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <RequirementForm
                  form={form}
                  index={index}
                  isSubmitting={isSubmitting}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Editar solicitud' : 'Crear solicitud'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProjectRequestForm;
