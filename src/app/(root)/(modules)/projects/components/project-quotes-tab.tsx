"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2 } from "lucide-react";
import { getToken } from "@/lib/auth";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectQuoteCreateSchema } from "@/lib/schemas/project-quote";
import { Company, ProjectQuote, Specialty, Scope, Subscope } from "@/types";

type ProjectQuoteFormValues = z.infer<typeof projectQuoteCreateSchema>;

interface ProjectQuotesTabProps {
  projectId: number;
  onQuoteChange: (quote?: ProjectQuote) => void;
}

export function ProjectQuotesTab({
  projectId,
  onQuoteChange,
}: ProjectQuotesTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [subscopes, setSubscopes] = useState<Subscope[]>([]);
  const [quotes, setQuotes] = useState<ProjectQuote[]>([]);

  // Filtros
  const [selectedSpecialty, setSelectedSpecialty] = useState("0");
  const [selectedScope, setSelectedScope] = useState("0");
  const [selectedSubscope, setSelectedSubscope] = useState("0");

  const form = useForm<ProjectQuoteFormValues>({
    resolver: zodResolver(projectQuoteCreateSchema),
    defaultValues: {
      projectId,
      companyId: 0,
      deadline: new Date(),
      itemDescription: "",
    },
  });

  useEffect(() => {
    loadSpecialties();
    loadCompanies();
    loadQuotes();
  }, []);

  useEffect(() => {
    if (selectedSpecialty) {
      loadScopes(Number(selectedSpecialty));
      setSelectedScope("0");
      setSelectedSubscope("0");
    } else {
      setScopes([]);
      setSelectedScope("0");
      setSubscopes([]);
      setSelectedSubscope("0");
    }
  }, [selectedSpecialty]);

  useEffect(() => {
    if (selectedScope) {
      loadSubscopes(Number(selectedScope));
      setSelectedSubscope("0");
    } else {
      setSubscopes([]);
      setSelectedSubscope("0");
    }
  }, [selectedScope]);

  const filteredCompanies = companies.filter((company) => {
    // Solo procesar compañías activas y no eliminadas
    if (!company.isActive || company.isDeleted) {
      return false;
    }

    // Obtener las especialidades de la compañía
    const companySpecialties = company.CompanySpecialties || [];

    // Si no hay filtros seleccionados, mostrar todas las compañías que tengan al menos una especialidad
    if (selectedSpecialty === "0") {
      return companySpecialties.length > 0;
    }

    // Buscar si la compañía tiene la especialidad seleccionada
    const hasSpecialty = companySpecialties.some(cs => {
      // Debe coincidir con la especialidad seleccionada
      const specialtyMatch = cs.specialtyId === Number(selectedSpecialty);
      if (!specialtyMatch) return false;

      // Si hay un alcance seleccionado, debe coincidir o ser nulo
      if (selectedScope !== "0") {
        if (!cs.scopeId || cs.scopeId !== Number(selectedScope)) {
          return false;
        }
      }

      // Si hay un subalcance seleccionado, debe coincidir o ser nulo
      if (selectedSubscope !== "0") {
        if (!cs.subscopeId || cs.subscopeId !== Number(selectedSubscope)) {
          return false;
        }
      }

      return true;
    });

    return hasSpecialty;
  });

  const loadSpecialties = async () => {
    try {
      const response = await fetch("/api/specialties", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      const { success, data, error } = await response.json();
      console.log('Specialties loaded:', data);
      if (success) {
        setSpecialties(data.filter((s: Specialty) => s.isActive && !s.isDeleted));
      } else {
        console.error("Error loading specialties:", error);
        toast.error("Error al cargar las especialidades");
      }
    } catch (error) {
      console.error("Error loading specialties:", error);
      toast.error("Error al cargar las especialidades");
    }
  };

  const loadScopes = async (specialtyId: number) => {
    try {
      const response = await fetch(`/api/specialties/${specialtyId}/scopes`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los alcances");
      }

      const { success, data, error } = await response.json();
      
      if (!success) {
        throw new Error(error || "Error al cargar los alcances");
      }

      setScopes(data.filter((s: Scope) => s.isActive && !s.isDeleted));
    } catch (error) {
      console.error("[SCOPES_LOAD]", error);
      toast.error("Error al cargar los alcances");
    }
  };

  const loadSubscopes = async (scopeId: number) => {
    try {
      const response = await fetch(`/api/scopes/${scopeId}/subscopes`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los subalcances");
      }

      const { success, data, error } = await response.json();
      
      if (!success) {
        throw new Error(error || "Error al cargar los subalcances");
      }

      setSubscopes(data.filter((s: Subscope) => s.isActive && !s.isDeleted));
    } catch (error) {
      console.error("[SUBSCOPES_LOAD]", error);
      toast.error("Error al cargar los subalcances");
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await fetch("/api/companies", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los asociados");
      }

      const { items } = await response.json();
      console.log('Companies response:', items);
      
      if (Array.isArray(items)) {
        setCompanies(items.filter((c) => c.isActive && !c.isDeleted));
      }
    } catch (error) {
      console.error("Error loading companies:", error);
      toast.error("Error al cargar los asociados");
    }
  };

  const loadQuotes = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/quotes`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar las cotizaciones");
      }

      const { success, data, error } = await response.json();
      
      if (!success && error) {
        throw new Error(error);
      }

      setQuotes(data || []);
    } catch (error) {
      console.error("[QUOTES_LOAD]", error);
      toast.error("Error al cargar las cotizaciones");
    }
  };

  const handleSubmit = async (data: ProjectQuoteFormValues) => {
    console.log('Submit data:', data);
    try {
      setIsLoading(true);

      // Validación adicional
      if (data.companyId === 0) {
        toast.error("Debes seleccionar un asociado");
        setIsLoading(false);
        return;
      }

      const payload = {
        ...data,
        projectId,
      };
      console.log('Sending payload:', payload);

      const response = await fetch(`/api/projects/${projectId}/quotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        if (responseData.type === "VALIDATION_ERROR") {
          responseData.fields?.forEach((field: { message: string }) => {
            toast.error(field.message);
          });
          setIsLoading(false);
          return;
        }
        throw new Error(responseData.error || "Error al crear la cotización");
      }

      if (!responseData.success) {
        throw new Error(responseData.error || "Error al crear la cotización");
      }

      toast.success("Cotización agregada correctamente");
      form.reset({
        projectId,
        companyId: 0,
        deadline: new Date(),
        itemDescription: "",
      });
      await loadQuotes();
      onQuoteChange(responseData.data);
    } catch (error) {
      console.error("[QUOTE_CREATE]", error);
      toast.error("Error al crear la cotización");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (quoteId: number) => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/projects/${projectId}/quotes/${quoteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar la cotización");
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Error al eliminar la cotización");
      }

      toast.success("Cotización eliminada correctamente");
      await loadQuotes();
      onQuoteChange();
    } catch (error) {
      console.error("[QUOTE_DELETE]", error);
      toast.error("Error al eliminar la cotización");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Filtros de búsqueda de asociado</h3>
        <div className="grid grid-cols-3 gap-4">
          <Select
            value={selectedSpecialty}
            onValueChange={setSelectedSpecialty}
          >
            <SelectTrigger>
              <SelectValue placeholder="Especialidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Todas las especialidades</SelectItem>
              {specialties.map((specialty) => (
                <SelectItem
                  key={specialty.id}
                  value={specialty.id.toString()}
                >
                  {specialty.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedScope}
            onValueChange={setSelectedScope}
            disabled={!selectedSpecialty}
          >
            <SelectTrigger>
              <SelectValue placeholder="Alcances" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Todos los alcances</SelectItem>
              {scopes.map((scope) => (
                <SelectItem
                  key={scope.id}
                  value={scope.id.toString()}
                >
                  {scope.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedSubscope}
            onValueChange={setSelectedSubscope}
            disabled={!selectedScope}
          >
            <SelectTrigger>
              <SelectValue placeholder="Subalcances" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Todos los subalcances</SelectItem>
              {subscopes.map((subscope) => (
                <SelectItem
                  key={subscope.id}
                  value={subscope.id.toString()}
                >
                  {subscope.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asociado</FormLabel>
                  <Select
                    value={field.value ? field.value.toString() : "0"}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un asociado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCompanies.length > 0 ? (
                        <>
                          <SelectItem value="0">Selecciona un asociado</SelectItem>
                          {filteredCompanies.map((company) => (
                            <SelectItem
                              key={company.id}
                              value={company.id.toString()}
                            >
                              {company.companyName}
                            </SelectItem>
                          ))}
                        </>
                      ) : (
                        <SelectItem value="no-results">
                          No hay asociados disponibles para los filtros seleccionados
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de entrega</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().split("T")[0]
                          : ""
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="itemDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción a cotizar</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descripción breve del ítem a cotizar"
                    {...field}
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
              onClick={() => {
                form.reset({
                  projectId,
                  companyId: 0,
                  deadline: new Date(),
                  itemDescription: "",
                });
              }}
              disabled={isLoading}
            >
              Limpiar
            </Button>
            <Button 
              type="button"
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando cotización...
                </>
              ) : (
                "Agregar cotización"
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asociado</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Descripción a cotizar</TableHead>
                <TableHead>Fecha de entrega</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>{quote.company?.companyName}</TableCell>
                  <TableCell>
                    {specialties.find(s => 
                      quote.company?.CompanySpecialties?.[0]?.specialtyId === s.id
                    )?.name}
                  </TableCell>
                  <TableCell>{quote.itemDescription}</TableCell>
                  <TableCell>
                    {new Date(quote.deadline).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(quote.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {quotes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No hay cotizaciones
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
