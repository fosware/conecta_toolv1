"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileText } from "lucide-react";
import { AssignedCompaniesTable } from "./components/assigned-companies-table";
import { AssignedCompany } from "@/lib/schemas/assigned_company";
import { ViewDocumentsDialog } from "./components/view-documents-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProjectRequestLogsModal from "../project_request_logs/components/project-request-logs-modal";
import { toast } from "sonner";

export default function AssignedCompaniesPage() {
  const [data, setData] = useState<AssignedCompany[]>([]);
  const [filteredData, setFilteredData] = useState<AssignedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<
    any | null
  >(null);
  const [selectedItem, setSelectedItem] = useState<AssignedCompany | null>(
    null
  );
  const [viewDocumentsDialogOpen, setViewDocumentsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AssignedCompany | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  // Estado para el modal de bitácora
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedCompanyForLogs, setSelectedCompanyForLogs] = useState<{
    id: number;
    name: string;
    projectRequestId: number;
    requirementName: string;
  } | null>(null);

  // Función para cargar los datos
  const loadData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const response = await fetch("/api/assigned_companies?onlyActive=true");
      if (!response.ok) {
        throw new Error("Error al cargar los datos");
      }

      const responseData = await response.json();

      // Asegurarse de que tenemos un array de items y filtrar los eliminados
      const items = responseData.items || [];

      // Filtrar registros eliminados y aquellos que no tienen información mínima necesaria
      const filteredItems = items.filter(
        (item: AssignedCompany) => {
          // Verificar que no esté eliminado
          if (item.isDeleted) return false;

          // Verificar que tenga información de la empresa
          if (!item.Company) return false;

          // Verificar que tenga información de la solicitud de proyecto
          if (!item.ProjectRequest) return false;

          return true;
        }
      );

      // Imprimir en consola para depuración
      console.log("Total de registros cargados:", items.length);
      console.log("Registros después de filtrar:", filteredItems.length);

      setData(filteredItems);
      setFilteredData(filteredItems);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(data);
    } else {
      const lowercasedFilter = searchTerm.toLowerCase();
      const filtered = data.filter((item) => {
        const companyName =
          item.Company?.name?.toLowerCase() ||
          item.Company?.comercialName?.toLowerCase() ||
          "";
        const projectTitle = item.ProjectRequest?.title?.toLowerCase() || "";
        const clientName =
          item.ProjectRequest?.clientArea?.client?.name?.toLowerCase() || "";
        const areaName =
          item.ProjectRequest?.clientArea?.areaName?.toLowerCase() || "";

        return (
          companyName.includes(lowercasedFilter) ||
          projectTitle.includes(lowercasedFilter) ||
          clientName.includes(lowercasedFilter) ||
          areaName.includes(lowercasedFilter)
        );
      });
      setFilteredData(filtered);
    }
  }, [searchTerm, data]);

  const handleRowClick = (item: AssignedCompany) => {
    if (expandedId === item.id) {
      setExpandedId(null);
      setSelectedRequestDetails(null);
    } else {
      setExpandedId(item.id);
      setSelectedRequestDetails(item.ProjectRequest || null);
    }
  };

  const handleViewDocuments = (item: AssignedCompany) => {
    setSelectedItem(item);
    setViewDocumentsDialogOpen(true);
  };

  const handleDeleteItem = (item: AssignedCompany) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  // Función para abrir el modal de bitácora
  const handleOpenLogsModal = (item: AssignedCompany) => {
    if (!item.Company || !item.Company.id || !item.ProjectRequest || !item.ProjectRequest.id) {
      toast.error("Error: No se encontró información de la compañía o del proyecto");
      return;
    }

    // Obtener el nombre del requerimiento (si hay varios, tomamos el primero o un valor por defecto)
    const requirementName = item.requirements && item.requirements.length > 0
      ? item.requirements[0].name
      : item.ProjectRequest.requirement || "Requerimiento general";

    setSelectedCompanyForLogs({
      id: item.Company.id,
      name: item.Company?.comercialName || item.Company?.name || "Empresa sin nombre",
      projectRequestId: item.ProjectRequest.id,
      requirementName: requirementName,
    });
    setLogsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(
        `/api/assigned_companies/${itemToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el elemento");
      }

      // Recargar los datos sin mostrar el indicador de carga
      loadData(false);

      // Cerrar el diálogo y limpiar el estado
      setDeleteDialogOpen(false);
      setItemToDelete(null);

      // Si el elemento eliminado estaba expandido, cerrarlo
      if (expandedId === itemToDelete.id) {
        setExpandedId(null);
        setSelectedRequestDetails(null);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-700">
          Solicitudes Asignadas
        </h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nueva Asignación
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Solicitudes Asignadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar solicitudes..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <AssignedCompaniesTable
            data={filteredData}
            loading={loading}
            onRowClick={handleRowClick}
            onViewDocuments={handleViewDocuments}
            onDeleteItem={handleDeleteItem}
            onRefreshData={loadData}
            expandedId={expandedId}
            onOpenLogs={handleOpenLogsModal}
          />
        </CardContent>
      </Card>

      {selectedItem && (
        <ViewDocumentsDialog
          open={viewDocumentsDialogOpen}
          onOpenChange={setViewDocumentsDialogOpen}
          item={selectedItem}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              asignación
              {itemToDelete && (
                <span className="font-semibold">
                  {" "}
                  "{itemToDelete.Company?.companyName || "Empresa"}" para el
                  proyecto "{itemToDelete.ProjectRequest?.title || "Solicitud"}"
                </span>
              )}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de bitácora */}
      <ProjectRequestLogsModal
        isOpen={logsModalOpen}
        onClose={() => {
          setLogsModalOpen(false);
          setSelectedCompanyForLogs(null);
        }}
        projectRequestId={selectedCompanyForLogs?.projectRequestId || 0}
        companyId={selectedCompanyForLogs?.id}
        title={`Bitácora - ${selectedCompanyForLogs?.name || 'Asociado'}`}
        requirementName={selectedCompanyForLogs?.requirementName}
      />
    </>
  );
}
