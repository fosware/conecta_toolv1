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
import { Plus, Search } from "lucide-react";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";
import { ProjectRequestWithRelations } from "@/lib/schemas/project_request";
import { ProjectRequestModal } from "./components/project-request-modal";
import { ProjectRequestsTable } from "./components/project-requests-table";
import { ProjectRequestRequirementsModal } from "./components/project-request-requirements-modal";
import { RequirementSpecialtiesModal } from "./components/requirement-specialties-modal";
import { RequirementCertificationsModal } from "./components/requirement-certifications-modal";
import { RequirementParticipantsModal } from "./components/requirement-participants-modal";
import ProjectRequestOverview from "./components/project-request-overview";
import { useUserRole } from "@/hooks/use-user-role";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";

export default function ProjectRequestsPage() {
  const {
    role,
    loading: roleLoading,
    isStaff,
    isAsociado,
    refresh: refreshUserRole,
  } = useUserRole();

  const [projectRequests, setProjectRequests] = useState<
    ProjectRequestWithRelations[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showActive, setShowActive] = useState(true);
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(
    null
  );
  const [selectedRequestDetails, setSelectedRequestDetails] =
    useState<ProjectRequestWithRelations | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<ProjectRequestWithRelations | null>(null);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para modales de requerimientos
  const [requirementsModalOpen, setRequirementsModalOpen] = useState(false);
  const [selectedItemForRequirements, setSelectedItemForRequirements] =
    useState<ProjectRequestWithRelations | null>(null);

  // Estados para modales de especialidades y certificaciones
  const [specialtiesModalOpen, setSpecialtiesModalOpen] = useState(false);
  const [certificationsModalOpen, setCertificationsModalOpen] = useState(false);
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);

  // Función para cargar las solicitudes de proyectos
  const loadProjectRequests = useCallback(async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setLoading(true);
      }

      const params = new URLSearchParams({
        onlyActive: showActive.toString(),
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm
      });

      const response = await fetch(
        `/api/project_requests?${params}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar las solicitudes de proyectos");
      }

      const data = await response.json();
      setProjectRequests(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (error) {
      console.error("Error loading project requests:", error);
      toast.error("Error al cargar las solicitudes de proyectos");
    } finally {
      setLoading(false);
    }
  }, [showActive, currentPage, itemsPerPage, searchTerm]);

  useEffect(() => {
    loadProjectRequests();
  }, [loadProjectRequests, showActive, currentPage, itemsPerPage, searchTerm]);

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/project_requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Error al cambiar el estado de la solicitud");
      }

      toast.success("Estado de la solicitud actualizado correctamente");
      await loadProjectRequests(false);
    } catch (error) {
      console.error("Error toggling project request status:", error);
      toast.error("Error al cambiar el estado de la solicitud");
    }
  };

  const handleRowClick = async (item: ProjectRequestWithRelations) => {
    if (expandedRequestId === item.id) {
      setExpandedRequestId(null);
      setSelectedRequestDetails(null);
    } else {
      setExpandedRequestId(item.id);

      try {
        // Cargar información detallada de la solicitud si es necesario
        const response = await fetch(`/api/project_requests/${item.id}`, {
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
          // Si no encontramos los datos en la estructura esperada, usamos los datos básicos
          console.warn("Estructura de respuesta inesperada:", data);
          setSelectedRequestDetails(item);
        }
      } catch (error) {
        console.error("Error loading project request details:", error);
        // Si falla la carga de detalles, usamos los datos básicos que ya tenemos
        setSelectedRequestDetails(item);
      }
    }
  };

  const handleEdit = (item: ProjectRequestWithRelations) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleManageRequirements = (item: ProjectRequestWithRelations) => {
    setSelectedItemForRequirements(item);
    setRequirementsModalOpen(true);
  };

  const handleManageSpecialties = (requirement: any) => {
    // Utilizamos el modal de requerimientos para gestionar especialidades
    setSelectedRequirement(requirement);
    setSpecialtiesModalOpen(true);
  };

  const handleManageCertifications = (requirement: any) => {
    // Utilizamos el modal de requerimientos para gestionar certificaciones
    setSelectedRequirement(requirement);
    setCertificationsModalOpen(true);
  };

  const handleManageParticipants = (requirement: any) => {
    // Utilizamos el modal de requerimientos para gestionar participantes
    setSelectedRequirement(requirement);
    setParticipantsModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  // Función para recargar los detalles de la solicitud seleccionada
  const reloadSelectedRequestDetails = async (showLoadingToast = false) => {
    if (expandedRequestId && selectedRequestDetails) {
      try {
        // Mostrar un indicador de carga sutil solo si se solicita explícitamente
        let toastId;
        if (showLoadingToast) {
          toastId = toast.loading("Actualizando datos...");
        }

        // Cargar información detallada de la solicitud
        const response = await fetch(`/api/project_requests/${expandedRequestId}`, {
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
        }

        // Cerrar el toast de carga si se mostró
        if (showLoadingToast && toastId) {
          toast.dismiss(toastId);
        }
      } catch (error) {
        console.error("Error reloading project request details:", error);
        // Solo mostrar el error si se solicitó explícitamente mostrar el toast
        if (showLoadingToast) {
          toast.error("Error al actualizar los detalles");
        }
      }
    }
  };

  // Función para recargar los datos después de actualizar documentos técnicos
  const refreshAfterDocumentChange = useCallback(() => {
    // Recargar la lista completa de solicitudes sin mostrar indicador de carga
    loadProjectRequests(false);

    // Si hay una solicitud expandida, recargar sus detalles
    if (expandedRequestId) {
      reloadSelectedRequestDetails(false);
    }
  }, [expandedRequestId, loadProjectRequests]);

  const handleModalSuccess = () => {
    // Recargar la lista de solicitudes sin mostrar indicador de carga
    loadProjectRequests(false);

    // Recargar los detalles de la solicitud seleccionada sin mostrar toast
    reloadSelectedRequestDetails(false);
  };

  // Manejador para cambiar la cantidad de elementos por página
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Resetear a la primera página cuando cambia el tamaño
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Solicitud de Proyectos</h1>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Solicitud
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between">
            <div>
              <CardTitle>Solicitud de Proyectos</CardTitle>
              <CardDescription></CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-active"
                  checked={showActive}
                  onCheckedChange={setShowActive}
                />
                <Label htmlFor="show-active">Mostrar activos</Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="relative flex-grow flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar solicitudes..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Resetear a la primera página al buscar
                }}
              />
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="mr-2">
                Mostrar:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="border rounded-md p-1"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
            </div>
          </div>

          <ProjectRequestsTable
            data={projectRequests}
            loading={loading}
            onToggleStatus={handleToggleStatus}
            onRowClick={handleRowClick}
            onEdit={handleEdit}
            onManageRequirements={handleManageRequirements}
            onManageSpecialties={handleManageSpecialties}
            onManageCertifications={handleManageCertifications}
            onManageParticipants={handleManageParticipants}
            expandedId={expandedRequestId}
            isStaff={isStaff}
            selectedRequestDetails={selectedRequestDetails}
            onRefreshData={refreshAfterDocumentChange}
          />

          {/* Componente de paginación */}
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>

      <ProjectRequestModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        item={selectedItem}
        onSuccess={handleModalSuccess}
      />

      <ProjectRequestRequirementsModal
        open={requirementsModalOpen}
        onOpenChange={setRequirementsModalOpen}
        projectRequest={selectedItemForRequirements}
        onSuccess={handleModalSuccess}
      />

      {/* Modal para gestionar especialidades del requerimiento */}
      <RequirementSpecialtiesModal
        open={specialtiesModalOpen}
        onOpenChange={setSpecialtiesModalOpen}
        requirement={selectedRequirement}
        onSuccess={() => handleModalSuccess()}
      />

      {/* Modal para gestionar certificaciones del requerimiento */}
      <RequirementCertificationsModal
        open={certificationsModalOpen}
        onOpenChange={setCertificationsModalOpen}
        requirement={selectedRequirement}
        onSuccess={() => handleModalSuccess()}
      />

      {/* Modal para gestionar participantes del requerimiento */}
      <RequirementParticipantsModal
        open={participantsModalOpen}
        onOpenChange={setParticipantsModalOpen}
        requirement={selectedRequirement}
        onSuccess={() => handleModalSuccess()}
      />
    </div>
  );
}
