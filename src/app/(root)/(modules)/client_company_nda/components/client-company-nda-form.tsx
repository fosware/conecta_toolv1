"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { ClientCompanyNDAItem } from "../types/client-company-nda-item";
import { Loader2 } from "lucide-react";

interface Client {
  id: number;
  name: string;
}

interface Company {
  id: number;
  companyName: string;
}

const formSchema = z.object({
  clientId: z.string().min(1, { message: "Seleccione un cliente" }),
  companyId: z.string().min(1, { message: "Seleccione un asociado" }),
  expirationDate: z.string().min(1, { message: "La fecha de expiración es requerida" }),
});

interface NDAFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem?: ClientCompanyNDAItem | null;
}

export function ClientCompanyNDAForm({
  isOpen,
  onClose,
  onSuccess,
  editItem,
}: NDAFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ndaFile, setNdaFile] = useState<File | null>(null);
  const [currentFileName, setCurrentFileName] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      companyId: "",
      expirationDate: "",
    },
  });

  // Función para formatear la fecha en formato DD/MM/YYYY para mostrar al usuario
  const formatDateForDisplay = (date: string | Date | null) => {
    if (!date) return "";
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) throw new Error("Invalid date");

      // Formatear fecha de forma simple
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", date, error);
      return "";
    }
  };

  // Cargar clientes y asociados
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Cargar clientes
        const clientsResponse = await fetch("/api/clients", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        if (!clientsResponse.ok) {
          throw new Error("Error al cargar los clientes");
        }

        const clientsData = await clientsResponse.json();
        setClients(clientsData.clients);

        // Cargar asociados
        const companiesResponse = await fetch("/api/companies", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        if (!companiesResponse.ok) {
          throw new Error("Error al cargar los asociados");
        }

        const companiesData = await companiesResponse.json();
        setCompanies(companiesData.data);

        // Si estamos editando, establecer los valores predeterminados
        if (editItem) {
          form.setValue("clientId", editItem.clientId.toString());
          form.setValue("companyId", editItem.companyId.toString());

          // Mostrar el nombre del archivo actual
          if (editItem.ndaSignedFileName) {
            setCurrentFileName(editItem.ndaSignedFileName);
          }

          // Establecer la fecha de expiración
          if (editItem.ndaExpirationDate) {
            // Crear una nueva fecha en UTC para evitar problemas con zonas horarias
            const date = new Date(editItem.ndaExpirationDate);
            // Ajustar para compensar la diferencia de zona horaria
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, "0");
            const day = String(date.getUTCDate()).padStart(2, "0");
            const formattedDate = `${year}-${month}-${day}`;
            form.setValue("expirationDate", formattedDate);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error al cargar los datos");
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, editItem, form]);

  // Limpiar el formulario cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setNdaFile(null);
      setCurrentFileName("");
    }
  }, [isOpen, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setNdaFile(files[0]);
      setCurrentFileName(files[0].name);
    } else {
      setNdaFile(null);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("clientId", values.clientId);
      formData.append("companyId", values.companyId);
      formData.append("expirationDate", values.expirationDate);

      if (ndaFile) {
        formData.append("ndaFile", ndaFile);
      }

      let url = "/api/client_company_nda";
      let method = "POST";

      // Si estamos editando, usar PUT y la URL con ID
      if (editItem) {
        url = `/api/client_company_nda/${editItem.id}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar el NDA");
      }

      toast.success(
        editItem ? "NDA actualizado correctamente" : "NDA creado correctamente"
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting NDA:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al guardar el NDA"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editItem ? "Editar NDA" : "Crear Nuevo NDA"}
          </DialogTitle>
          <DialogDescription>
            Complete los campos para {editItem ? "actualizar el" : "crear un nuevo"} NDA.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem
                            key={client.id}
                            value={client.id.toString()}
                          >
                            {client.name}
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
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asociado</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un asociado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem
                            key={company.id}
                            value={company.id.toString()}
                          >
                            {company.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Documento NDA Firmado</FormLabel>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className="flex-1"
                />
                {currentFileName && !ndaFile && (
                  <div className="mt-1">
                    <span className="text-sm text-muted-foreground">
                      Actual: {currentFileName}
                    </span>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Expiración</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editItem ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
