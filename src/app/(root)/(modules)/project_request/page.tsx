"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import ProjectRequestList from "./components/project-request-list";
import { ProjectRequestModal } from "./components/project-request-modal";

const ProjectRequestPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActive, setShowActive] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      params.append("showActive", showActive.toString());
      params.append("page", "1");
      params.append("limit", "10");

      const response = await fetch(`/api/project_request?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar las solicitudes");
      }

      const data = await response.json();
      setRequests(data.items || []);
    } catch (error) {
      console.error("Error loading requests:", error);
      toast.error("Error al cargar las solicitudes");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, showActive]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleSuccess = useCallback(() => {
    loadRequests();
    setEditItem(null);
  }, [loadRequests]);

  const handleEdit = useCallback(async (id: number) => {
    try {
      // Mostrar toast de carga
      const loadingToast = toast.loading("Cargando datos de la solicitud...");
      
      const response = await fetch(`/api/project_request/${id}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
      });

      // Verificar si la respuesta es válida antes de intentar parsear el JSON
      const responseText = await response.text();
      
      let data;
      
      try {
        // Intentar parsear la respuesta como JSON
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error al parsear la respuesta");
        toast.dismiss(loadingToast);
        throw new Error("Error al parsear la respuesta del servidor");
      }
      
      // Cerrar el toast de carga
      toast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error(data?.error || "Error al cargar los datos de la solicitud");
      }
      
      // Formatear los datos para el formulario si es necesario
      const formattedData = {
        ...data,
        clientAreaId: data.clientAreaId,
        details: data.details.map((detail: any) => ({
          id: detail.id,
          name: detail.name,
          certifications: Array.isArray(detail.certifications) ? detail.certifications : [],
          specialties: Array.isArray(detail.specialties) ? detail.specialties : [],
          scopeId: detail.scopeId || null,
          subscopeId: detail.subscopeId || null,
        })),
      };
      
      console.log("Datos formateados para edición:", {
        id: formattedData.id,
        title: formattedData.title,
        detailsCount: formattedData.details.length,
        details: formattedData.details.map((d: any) => ({
          name: d.name,
          certCount: d.certifications?.length || 0,
          specCount: d.specialties?.length || 0
        }))
      });
      
      setEditItem(formattedData);
      setModalOpen(true);
    } catch (error: any) {
      console.error("Error loading request data:", error);
      toast.error(error.message || "Error al cargar los datos de la solicitud");
    }
  }, []);

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Solicitudes de Proyecto</h1>
          <Button onClick={() => {
            setEditItem(null);
            setModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Solicitud
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex flex-row gap-2 md:gap-4 flex-1">
            <div className="flex-1">
              <label
                htmlFor="search-request"
                className="text-sm font-medium mb-2 block"
              >
                Buscar solicitud
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-request"
                  placeholder="Buscar solicitud..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 min-w-[300px]"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <div className="h-[40px] flex items-center">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showActive}
                  onCheckedChange={setShowActive}
                  id="active-filter"
                />
                <Label htmlFor="active-filter" className="text-sm">
                  Mostrar solo activos
                </Label>
              </div>
            </div>
          </div>
        </div>

        <ProjectRequestList 
          data={requests}
          loading={loading}
          onRefresh={loadRequests}
          onEdit={handleEdit}
        />

        <ProjectRequestModal 
          open={modalOpen} 
          onOpenChange={setModalOpen} 
          onSuccess={handleSuccess}
          editItem={editItem}
        />
      </div>
    </div>
  );
};

export default ProjectRequestPage;
