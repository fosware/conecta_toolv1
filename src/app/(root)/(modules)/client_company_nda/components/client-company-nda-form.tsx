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
  expirationDate: z.string().optional(),
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
  const [signedNdaFile, setSignedNdaFile] = useState<File | null>(null);
  const [currentFileName, setCurrentFileName] = useState("");
  const [currentSignedFileName, setCurrentSignedFileName] = useState("");
  const [displayDate, setDisplayDate] = useState<string>("");
  const [signedDate, setSignedDate] = useState<string>("");

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

      return d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC", // Usar UTC para evitar problemas con zonas horarias
      });
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
          setCurrentFileName(editItem.ndaFileName || "");
          setCurrentSignedFileName(editItem.ndaSignedFileName || "");

          if (editItem.ndaExpirationDate) {
            // Crear fecha UTC para evitar problemas con zonas horarias
            const dateObj = new Date(editItem.ndaExpirationDate);

            // Extraer año, mes y día de la fecha UTC
            const year = dateObj.getUTCFullYear();
            const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
            const day = String(dateObj.getUTCDate()).padStart(2, "0");
            const formattedDate = `${year}-${month}-${day}`;

            form.setValue("expirationDate", formattedDate);

            // Actualizar la fecha de visualización
            setDisplayDate(formatDateForDisplay(dateObj));
          }

          if (editItem.ndaSignedAt) {
            const signedDateObj = new Date(editItem.ndaSignedAt);
            const year = signedDateObj.getUTCFullYear();
            const month = String(signedDateObj.getUTCMonth() + 1).padStart(
              2,
              "0"
            );
            const day = String(signedDateObj.getUTCDate()).padStart(2, "0");
            const formattedSignedDate = `${year}-${month}-${day}`;
            setSignedDate(formattedSignedDate);
          } else {
            setSignedDate("");
          }
        } else {
          // Si es un nuevo NDA, resetear el formulario
          form.reset({
            clientId: "",
            companyId: "",
            expirationDate: "",
          });
          setCurrentFileName("");
          setCurrentSignedFileName("");
          setDisplayDate("");
          setSignedDate("");
          setNdaFile(null);
          setSignedNdaFile(null);
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
    } else {
      // Cuando se cierra el modal, resetear el formulario
      form.reset();
      setNdaFile(null);
      setSignedNdaFile(null);
      setCurrentFileName("");
      setCurrentSignedFileName("");
      setDisplayDate("");
      setSignedDate("");
    }
  }, [isOpen, editItem, form]);

  // Cuando se selecciona un archivo de NDA firmado, establecer la fecha de firma al día actual
  useEffect(() => {
    if (signedNdaFile && !signedDate) {
      // Obtener la fecha actual en formato YYYY-MM-DD
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;
      
      setSignedDate(formattedDate);
    }
  }, [signedNdaFile, signedDate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Verificar que sea un PDF
      if (file.type !== "application/pdf") {
        toast.error("El archivo debe ser un PDF");
        return;
      }
      setNdaFile(file);
    }
  };

  const handleSignedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Verificar que sea un PDF
      if (file.type !== "application/pdf") {
        toast.error("El archivo debe ser un PDF");
        return;
      }
      setSignedNdaFile(file);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      // Preparar FormData para la solicitud
      const formData = new FormData();
      formData.append("clientId", values.clientId);
      formData.append("companyId", values.companyId);

      if (values.expirationDate) {
        // Convertir la fecha a formato ISO UTC para evitar problemas con zonas horarias
        const dateObj = new Date(values.expirationDate);
        const isoDate = dateObj.toISOString().split("T")[0];
        formData.append("expirationDate", isoDate);
      }

      // Si hay un nuevo archivo, lo añadimos al FormData
      if (ndaFile) {
        formData.append("ndaFile", ndaFile);
      }

      // Determinar si estamos creando o actualizando
      const url = editItem
        ? `/api/client_company_nda/${editItem.id}`
        : "/api/client_company_nda";

      const method = editItem ? "PUT" : "POST";

      // Enviar la solicitud
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Manejar errores específicos
        if (response.status === 409) {
          toast.error("Ya existe un NDA activo para este cliente y asociado");
        } else {
          toast.error(data.error || "Error al guardar el NDA");
        }
        setIsSubmitting(false);
        return;
      }

      // Obtener el ID del NDA (ya sea del existente o del recién creado)
      const ndaId = editItem ? editItem.id : data.data.id;

      // Si hay un archivo firmado, lo subimos usando la ruta específica
      if (signedNdaFile) {
        // Validar que se haya seleccionado una fecha de firma
        if (!signedDate) {
          toast.error("Debe seleccionar una fecha de firma");
          setIsSubmitting(false);
          return;
        }

        const signedFormData = new FormData();
        signedFormData.append("signedFile", signedNdaFile);
        // Usar la fecha de firma seleccionada por el usuario
        signedFormData.append("signedDate", signedDate);

        const signedResponse = await fetch(
          `/api/client_company_nda/${ndaId}/upload-signed`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
            body: signedFormData,
          }
        );

        if (!signedResponse.ok) {
          const errorData = await signedResponse.json();
          throw new Error(errorData.error || "Error al guardar el NDA firmado");
        }
      }

      toast.success(
        editItem ? "NDA actualizado correctamente" : "NDA creado correctamente"
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving NDA:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al guardar el NDA"
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
            {editItem
              ? "Actualice la información del NDA"
              : "Complete la información para crear un nuevo NDA"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
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
                <FormLabel>Documento NDA</FormLabel>
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
                        disabled={
                          isSubmitting || (!ndaFile && !currentFileName)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                    {!ndaFile && !currentFileName && (
                      <p className="text-sm text-muted-foreground">
                        Primero debe seleccionar un documento NDA
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Documento NDA Firmado</FormLabel>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleSignedFileChange}
                  disabled={isSubmitting || !ndaFile && !currentFileName}
                  className="flex-1"
                />
                {currentSignedFileName && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSignedNdaFile(null)}
                    disabled={isSubmitting}
                  >
                    Limpiar
                  </Button>
                )}
                {currentSignedFileName && (
                  <p className="text-sm text-muted-foreground">
                    Archivo actual: {currentSignedFileName}
                  </p>
                )}
                {!ndaFile && !currentFileName && (
                  <p className="text-sm text-muted-foreground">
                    Primero debe subir un NDA original
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <FormLabel>Fecha de Firma</FormLabel>
                <Input
                  type="date"
                  value={signedDate}
                  onChange={(e) => setSignedDate(e.target.value)}
                  disabled={
                    isSubmitting ||
                    (!signedNdaFile && !currentSignedFileName) ||
                    (!ndaFile && !currentFileName)
                  }
                  required
                />
                {!signedNdaFile && !currentSignedFileName && (
                  <p className="text-sm text-muted-foreground">
                    Primero debe seleccionar un documento NDA firmado
                  </p>
                )}
              </div>

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
