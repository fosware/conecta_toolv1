"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StaffTab } from "./components/staff-tab";
import { toast } from "sonner";

interface Company {
  id: number;
  companyName: string;
  // ... otros campos de la empresa
}

export default function CompanyDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/companies/${params.id}`);
        if (!response.ok) {
          throw new Error("Error al cargar la empresa");
        }
        const data = await response.json();
        setCompany(data);
      } catch (error) {
        toast.error("Error al cargar la información de la empresa");
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [params.id]);

  if (loading) {
    return (
      <div className="w-full h-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold">Empresa no encontrada</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{company.companyName}</h1>
      </div>

      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="staff">Personal</TabsTrigger>
          <TabsTrigger value="specialties">Especialidades</TabsTrigger>
          <TabsTrigger value="certifications">Certificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          {/* Contenido de detalles */}
          <div className="p-4 rounded-lg border">
            Detalles de la empresa
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <StaffTab companyId={company.id} />
        </TabsContent>

        <TabsContent value="specialties">
          {/* Contenido de especialidades */}
          <div className="p-4 rounded-lg border">
            Especialidades de la empresa
          </div>
        </TabsContent>

        <TabsContent value="certifications">
          {/* Contenido de certificaciones */}
          <div className="p-4 rounded-lg border">
            Certificaciones de la empresa
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
