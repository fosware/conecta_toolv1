"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import {
  type ProjectRequestCreate,
  projectRequestCreateSchema,
} from "@/lib/schemas/project_request";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";

// Definición de interfaces
interface Client {
  id: number;
  name: string;
}

interface ClientArea {
  id: number;
  areaName: string;
  clientId: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  client: {
    id: number;
    name: string;
  };
}

interface ProjectRequestFormProps {
  initialData?: Partial<ProjectRequestCreate>;
  onSubmit: (data: ProjectRequestCreate) => Promise<void>;
  isSubmitting?: boolean;
  validationErrors?: { field: string; message: string }[];
  onCancel?: () => void;
}

export function ProjectRequestForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  validationErrors = [],
  onCancel,
}: ProjectRequestFormProps) {
  // Estados para manejar los datos y la UI
  const [clientAreas, setClientAreas] = useState<ClientArea[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<ClientArea[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Configuración del formulario
  const form = useForm<ProjectRequestCreate>({
    resolver: zodResolver(projectRequestCreateSchema),
    defaultValues: {
      title: initialData?.title || "",
      observation: initialData?.observation || "",
      clientAreaId: initialData?.clientAreaId || undefined,
      requestDate: initialData?.requestDate
        ? new Date(initialData.requestDate)
        : new Date(),
    },
  });

  // Cargar datos de la API
  useEffect(() => {
    const loadClientAreas = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/clients/areas", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al cargar las áreas de clientes");
        }

        const data = await response.json();
        const areas: ClientArea[] = data.items || [];
        setClientAreas(areas);

        // Extraer clientes únicos de las áreas
        const uniqueClients: Client[] = [];
        const clientMap = new Map<number, boolean>();

        areas.forEach((area: ClientArea) => {
          if (!clientMap.has(area.client.id)) {
            clientMap.set(area.client.id, true);
            uniqueClients.push({
              id: area.client.id,
              name: area.client.name,
            });
          }
        });

        setClients(uniqueClients);
        setDataLoaded(true);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error al cargar las áreas de clientes");
      } finally {
        setLoading(false);
      }
    };

    loadClientAreas();
  }, []);

  // Inicializar selección cuando se cargan los datos o cambia initialData
  useEffect(() => {
    if (dataLoaded && initialData?.clientAreaId && clientAreas.length > 0) {
      const selectedArea = clientAreas.find((area) => area.id === initialData.clientAreaId);
      if (selectedArea) {
        // Establecer el cliente seleccionado
        setSelectedClientId(selectedArea.clientId);

        // Filtrar áreas para mostrar solo las del cliente seleccionado
        const filtered = clientAreas.filter((area) => area.clientId === selectedArea.clientId);
        setFilteredAreas(filtered);
      }
    }
  }, [dataLoaded, initialData, clientAreas]);

  // Aplicar errores de validación externos
  useEffect(() => {
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => {
        form.setError(error.field as any, {
          type: "manual",
          message: error.message,
        });
      });
    }
  }, [validationErrors, form]);

  const handleSubmit = async (data: ProjectRequestCreate) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Error en el formulario:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título de la solicitud</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Ingrese el título de la solicitud"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Selección de Cliente */}
        <div className="space-y-6">
          <FormItem>
            <FormLabel>Cliente</FormLabel>
            <Select
              onValueChange={(value) => {
                const clientId = parseInt(value);
                setSelectedClientId(clientId);

                // Filtrar áreas por el cliente seleccionado
                const filtered = clientAreas.filter((area) => area.clientId === clientId);
                setFilteredAreas(filtered);

                // Limpiar la selección de área si cambia el cliente
                // Usamos 0 como valor temporal para evitar errores de tipo
                // El formulario no se enviará con este valor ya que el Select estará vacío
                form.setValue("clientAreaId", 0);
              }}
              value={selectedClientId?.toString() || ""}
              disabled={isSubmitting || loading}
            >
              <FormControl>
                <SelectTrigger className="min-h-[40px] py-2">
                  <SelectValue placeholder="Seleccione un cliente" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="max-h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Cargando...</span>
                  </div>
                ) : clients.length === 0 ? (
                  <div className="p-4 text-center text-sm">
                    No hay clientes disponibles
                  </div>
                ) : (
                  clients.map((client) => (
                    <SelectItem
                      key={client.id}
                      value={client.id.toString()}
                      className="py-3"
                    >
                      {client.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FormItem>

          {/* Selección de Área del Cliente */}
          <FormField
            control={form.control}
            name="clientAreaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área / Contacto</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString() || ""}
                  disabled={isSubmitting || loading || !selectedClientId}
                >
                  <FormControl>
                    <SelectTrigger className="min-h-[40px] py-2">
                      <SelectValue
                        placeholder={
                          selectedClientId
                            ? "Seleccione un área/contacto"
                            : "Primero seleccione un cliente"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[300px]">
                    {loading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Cargando...</span>
                      </div>
                    ) : !selectedClientId ? (
                      <div className="p-4 text-center text-sm">
                        Primero seleccione un cliente
                      </div>
                    ) : filteredAreas.length === 0 ? (
                      <div className="p-4 text-center text-sm">
                        No hay áreas disponibles para este cliente
                      </div>
                    ) : (
                      filteredAreas.map((area) => (
                        <SelectItem
                          key={area.id}
                          value={area.id.toString()}
                          className="py-3"
                        >
                          {area.areaName} - {area.contactName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="requestDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de petición</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  disabled={isSubmitting}
                  value={
                    field.value instanceof Date
                      ? field.value.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      // Crear una fecha UTC a partir del valor del input
                      // Esto evita problemas de zona horaria
                      const [year, month, day] = e.target.value
                        .split("-")
                        .map(Number);
                      const date = new Date(
                        Date.UTC(year, month - 1, day, 12, 0, 0)
                      );
                      field.onChange(date);
                    } else {
                      field.onChange(new Date());
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
          name="observation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observaciones</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ingrese observaciones sobre el proyecto"
                  {...field}
                  disabled={isSubmitting}
                  className="min-h-[100px]"
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
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
    </Form>
  );
}
