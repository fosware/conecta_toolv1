"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
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
import { projectQuoteCreateSchema } from "@/lib/schemas/project-quote";
import { Company, ProjectQuote, Specialty, Scope, Subscope, CompanySpecialty } from "@/types";

type ProjectQuoteFormValues = z.infer<typeof projectQuoteCreateSchema>;

interface ProjectQuoteFormProps {
  projectId: number;
  onClose: () => void;
  onSubmit?: (data: ProjectQuote) => void;
  initialData?: ProjectQuote | null;
}

interface QuoteItem {
  companyId: number;
  companyName: string;
  specialtyName: string;
  deadline: Date;
  itemDescription: string;
}

export default function ProjectQuoteForm({
  projectId,
  onClose,
  onSubmit,
  initialData,
}: ProjectQuoteFormProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [subscopes, setSubscopes] = useState<Subscope[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);

  // Filtros
  const [selectedSpecialty, setSelectedSpecialty] = useState<number>(0);
  const [selectedScope, setSelectedScope] = useState<number>(0);
  const [selectedSubscope, setSelectedSubscope] = useState<number>(0);

  const form = useForm<ProjectQuoteFormValues>({
    resolver: zodResolver(projectQuoteCreateSchema),
    defaultValues: {
      projectId,
      companyId: initialData?.companyId || 0,
      deadline: initialData?.deadline || new Date(),
      itemDescription: initialData?.itemDescription || "",
    },
  });

  useEffect(() => {
    loadSpecialties();
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedSpecialty) {
      loadScopes(selectedSpecialty);
    }
  }, [selectedSpecialty]);

  useEffect(() => {
    if (selectedScope) {
      loadSubscopes(selectedScope);
    }
  }, [selectedScope]);

  useEffect(() => {
    filterCompanies();
  }, [selectedSpecialty, selectedScope, selectedSubscope, companies]);

  const loadCompanies = async () => {
    try {
      const response = await fetch("/api/companies", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar las empresas");
      }

      const { data } = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Formato de respuesta inválido");
      }
      
      setCompanies(data.filter((company: Company) => company.isActive && !company.isDeleted));
    } catch (error) {
      console.error("[COMPANIES_LOAD]", error);
      toast.error("Error al cargar las empresas");
    }
  };

  const loadSpecialties = async () => {
    try {
      const response = await fetch("/api/specialties", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar las especialidades");
      }

      const { data } = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Formato de respuesta inválido");
      }
      setSpecialties(data.filter((s: Specialty) => s.isActive && !s.isDeleted));
    } catch (error) {
      console.error("[SPECIALTIES_LOAD]", error);
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

      const { data } = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Formato de respuesta inválido");
      }
      setScopes(data.filter((s: Scope) => s.isActive && !s.isDeleted));
      setSelectedScope(0); // Reset scope selection
      setSelectedSubscope(0); // Reset subscope selection
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

      const { data } = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Formato de respuesta inválido");
      }
      setSubscopes(data.filter((s: Subscope) => s.isActive && !s.isDeleted));
      setSelectedSubscope(0); // Reset subscope selection
    } catch (error) {
      console.error("[SUBSCOPES_LOAD]", error);
      toast.error("Error al cargar los subalcances");
    }
  };

  const filterCompanies = () => {
    let filtered = [...companies];

    if (selectedSpecialty) {
      filtered = filtered.filter(company => 
        company.CompanySpecialties?.some(cs => 
          cs.specialtyId === selectedSpecialty &&
          (!selectedScope || cs.scopeId === selectedScope) &&
          (!selectedSubscope || cs.subscopeId === selectedSubscope)
        )
      );
    }

    setFilteredCompanies(filtered);
  };

  const handleAddQuoteItem = (data: ProjectQuoteFormValues) => {
    const company = companies.find(c => c.id === data.companyId);
    const specialty = specialties.find(s => s.id === selectedSpecialty);
    
    if (!company || !specialty) {
      toast.error("Por favor selecciona una empresa y una especialidad");
      return;
    }

    const newItem: QuoteItem = {
      companyId: company.id,
      companyName: company.companyName,
      specialtyName: specialty.name,
      deadline: data.deadline,
      itemDescription: data.itemDescription,
    };

    setQuoteItems(prev => [...prev, newItem]);
    form.reset({
      projectId,
      companyId: 0,
      deadline: new Date(),
      itemDescription: "",
    });
  };

  const handleRemoveQuoteItem = (index: number) => {
    setQuoteItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (data: ProjectQuoteFormValues) => {
    try {
      setIsLoading(true);

      // Crear todas las cotizaciones
      const promises = quoteItems.map(item => 
        fetch(`/api/projects/${projectId}/quotes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            projectId,
            companyId: item.companyId,
            deadline: item.deadline,
            itemDescription: item.itemDescription,
          }),
        })
      );

      await Promise.all(promises);

      toast.success("Cotizaciones agregadas correctamente");
      onClose();
    } catch (error) {
      console.error("[QUOTES_SUBMIT]", error);
      toast.error("Error al crear las cotizaciones");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Filtros de búsqueda de asociado</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <Select
              value={selectedSpecialty ? String(selectedSpecialty) : undefined}
              onValueChange={(value) => setSelectedSpecialty(Number(value))}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Especialidades" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
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
              value={selectedScope ? String(selectedScope) : undefined}
              onValueChange={(value) => setSelectedScope(Number(value))}
              disabled={!selectedSpecialty}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Alcances" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
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
              value={selectedSubscope ? String(selectedSubscope) : undefined}
              onValueChange={(value) => setSelectedSubscope(Number(value))}
              disabled={!selectedScope}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Subalcances" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
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
          <FormField
            control={form.control}
            name="companyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <Select
                  value={field.value?.toString()}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una empresa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.isArray(filteredCompanies) && filteredCompanies.map((company) => (
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

          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha límite</FormLabel>
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

          <FormField
            control={form.control}
            name="itemDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción del ítem a cotizar</FormLabel>
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

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agregar cotización
            </Button>
          </div>

          <div className="mt-4">
            <h2 className="text-lg font-bold">Cotizaciones agregadas</h2>
            <ul>
              {quoteItems.map((item, index) => (
                <li key={index} className="flex justify-between">
                  <span>
                    {item.companyName} - {item.specialtyName} - {item.deadline.toISOString().split("T")[0]}
                  </span>
                  <Button type="button" variant="destructive" onClick={() => handleRemoveQuoteItem(index)}>
                    Eliminar
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </form>
    </Form>
  );
}
