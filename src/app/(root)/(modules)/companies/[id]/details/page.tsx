"use client";

import { useEffect, useState, use } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StaffTab } from "../components/staff-tab";
import { toast } from "sonner";

interface Company {
  id: number;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
}

export default function CompanyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        setLoading(true);
        console.log("Loading company with ID:", id);
        const response = await fetch(`/api/companies/${id}`);
        if (!response.ok) {
          throw new Error("Error al cargar la empresa");
        }
        const data = await response.json();
        console.log("Company data loaded:", data);
        setCompany(data);
      } catch (error) {
        console.error("Error loading company:", error);
        toast.error("Error al cargar la información de la empresa");
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [id]);

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

  // Asegurarnos de que company.id sea un número
  const companyId = typeof company.id === 'string' ? parseInt(company.id) : company.id;
  console.log("Rendering company details with ID:", companyId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{company.companyName}</h1>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="staff">Personal</TabsTrigger>
          <TabsTrigger value="specialties">Especialidades</TabsTrigger>
          <TabsTrigger value="certifications">Certificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="p-4 rounded-lg border space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Contacto</h3>
                <p>{company.contactName}</p>
              </div>
              <div>
                <h3 className="font-semibold">Email</h3>
                <p>{company.email}</p>
              </div>
              <div>
                <h3 className="font-semibold">Teléfono</h3>
                <p>{company.phone}</p>
              </div>
              <div>
                <h3 className="font-semibold">Ciudad</h3>
                <p>{company.city}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="staff">
          {!loading && company && <StaffTab companyId={companyId} />}
        </TabsContent>

        <TabsContent value="specialties">
          <div className="p-4 rounded-lg border">
            Especialidades de la empresa
          </div>
        </TabsContent>

        <TabsContent value="certifications">
          <div className="p-4 rounded-lg border">
            Certificaciones de la empresa
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
