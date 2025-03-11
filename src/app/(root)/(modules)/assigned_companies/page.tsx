"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
// TODO: Crear el componente AssignedCompaniesTable
// import { AssignedCompaniesTable } from "./components/assigned-companies-table";
import { UploadNDAModal } from "./components/upload-nda-modal";
import { ViewDocumentsModal } from "./components/view-documents-modal";
import { Search, FileText } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { getToken } from "@/lib/auth";

import { ProjectRequestWithRelations } from "@/lib/schemas/project_request";

export default function AssignedCompaniesPage() {
  const {
    role,
    loading: roleLoading,
    isStaff,
    isAsociado,
    refresh: refreshUserRole,
  } = useUserRole();

  const [assignedRequests, setAssignedRequests] = useState<
    ProjectRequestWithRelations[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showActive, setShowActive] = useState(true);
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(
    null
  );
  const [selectedRequestDetails, setSelectedRequestDetails] =
    useState<ProjectRequestWithRelations | null>(null);
  
  const [ndaModalOpen, setNdaModalOpen] = useState(false);
  const [selectedItemForNda, setSelectedItemForNda] = 
    useState<any | null>(null);
  
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [selectedItemForDocuments, setSelectedItemForDocuments] = 
    useState<any | null>(null);

  // Función para cargar las solicitudes asignadas
  const loadAssignedRequests = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const response = await fetch(
        `/api/assigned_companies?onlyActive=${showActive}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar las solicitudes asignadas");
      }

      const data = await response.json();
      setAssignedRequests(data.items || []);
    } catch (error) {
      console.error("Error loading assigned requests:", error);
      toast.error("Error al cargar las solicitudes asignadas");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [showActive]);

  useEffect(() => {
    loadAssignedRequests();
  }, [loadAssignedRequests, showActive]);

  const handleRowClick = async (item: any) => {
    if (expandedRequestId === item.id) {
      setExpandedRequestId(null);
      setSelectedRequestDetails(null);
    } else {
      setExpandedRequestId(item.id);

      try {
        // Cargar información detallada de la solicitud
        const response = await fetch(`/api/project_requests/${item.projectRequestId}`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al cargar los detalles de la solicitud");
        }

        const data = await response.json();
        // Verificar la estructura de la respuesta
        if (data.data) {
          setSelectedRequestDetails(data.data);
        } else if (data.item) {
          setSelectedRequestDetails(data.item);
        } else {
          console.warn("Estructura de respuesta inesperada:", data);
          setSelectedRequestDetails(null);
        }
      } catch (error) {
        console.error("Error loading project request details:", error);
        setSelectedRequestDetails(null);
      }
    }
  };

  const handleUploadNda = (item: any) => {
    setSelectedItemForNda(item);
    setNdaModalOpen(true);
  };

  const handleViewDocuments = (item: any) => {
    setSelectedItemForDocuments(item);
    setDocumentsModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadAssignedRequests(false);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Solicitudes Asignadas</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Solicitudes de Proyectos Asignadas</CardTitle>
              <CardDescription>
                Gestione las solicitudes en las que su empresa ha sido seleccionada
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-active"
                checked={showActive}
                onCheckedChange={setShowActive}
              />
              <Label htmlFor="show-active">Mostrar activos</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* TODO: Crear el componente AssignedCompaniesTable */}
          <div className="p-4 text-center">
            <p>Componente de tabla en desarrollo</p>
          </div>
        </CardContent>
      </Card>

      {selectedItemForNda && (
        <UploadNDAModal
          open={ndaModalOpen}
          onClose={() => {
            setNdaModalOpen(false);
            setSelectedItemForNda(null);
            handleModalSuccess();
          }}
          projectRequestCompany={selectedItemForNda}
        />
      )}

      {selectedItemForDocuments && (
        <ViewDocumentsModal
          open={documentsModalOpen}
          onClose={() => {
            setDocumentsModalOpen(false);
            setSelectedItemForDocuments(null);
          }}
          projectRequestCompany={selectedItemForDocuments}
        />
      )}
    </div>
  );
}
