"use client";

import { useState, useEffect } from "react";
import { ProjectQuote } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";

interface Company {
  id: number;
  name: string;
}

interface ProjectQuoteFormProps {
  initialData?: ProjectQuote;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

export function ProjectQuoteForm({
  initialData,
  onSubmit,
  onCancel,
}: ProjectQuoteFormProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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

        const data = await response.json();
        setCompanies(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al cargar las empresas");
      }
    };

    loadCompanies();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyId">Empresa</Label>
          <Select
            name="companyId"
            defaultValue={initialData?.companyId?.toString()}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una empresa" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id.toString()}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={initialData?.date?.split('T')[0]}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            defaultValue={initialData?.amount}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select name="status" defaultValue={initialData?.status || "PENDING"} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pendiente</SelectItem>
              <SelectItem value="APPROVED">Aprobada</SelectItem>
              <SelectItem value="REJECTED">Rechazada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={initialData?.description}
            required
          />
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {initialData ? "Actualizar" : "Crear"} cotización
        </Button>
      </CardFooter>
    </form>
  );
}
