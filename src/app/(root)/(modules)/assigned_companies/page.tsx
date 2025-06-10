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
import { Pagination } from "@/components/ui/pagination";

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
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estado para el modal de bitácora
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedCompanyForLogs, setSelectedCompanyForLogs] = useState<{
    companyId: number;
    requirementId: number;
    companyName: string;
    projectRequestId: number;
    requirementName: string;
  } | null>(null);

  // Función para cargar los datos básicos (solo lo necesario para la tabla)
  const loadData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        onlyActive: "true",
        basic: "true",
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm
      });

      const response = await fetch(`/api/assigned_companies?${params}`);
      if (!response.ok) {
        throw new Error("Error al cargar los datos");
      }

      const result = await response.json();
      // Filtrar elementos eliminados (esto debería hacerse en el backend, pero por si acaso)
      const filteredItems = result.items.filter((item: any) => {
        // Verificar que no esté eliminado y tenga información de la solicitud de proyecto
        if (item.isActive === false) return false;
        if (!item.ProjectRequest) return false;
        return true;
      });

      setData(filteredItems);
      setFilteredData(filteredItems);
      setTotalPages(result.totalPages || 1);
      setTotalItems(result.total || 0);
    } catch (error) {
      toast.error("Error al cargar los datos");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };
  
  // Función para cargar los detalles de un registro específico
  const loadItemDetails = async (id: number) => {
    try {
      // Mostrar un indicador de carga en la fila expandida
      setSelectedRequestDetails({ loading: true });
      
      const response = await fetch(`/api/assigned_companies?id=${id}`);
      if (!response.ok) {
        throw new Error("Error al cargar los detalles");
      }

      const responseData = await response.json();
      const detailedItem = responseData.items?.[0] || null;
      
      if (detailedItem) {
        // Asegurarnos de preservar la información de ProjectRequirements
        // y no perder datos importantes durante la actualización
        const preservedItem = {
          ...detailedItem,
          // Asegurarnos de que ProjectRequirements contenga toda la información necesaria
          ProjectRequirements: {
            ...(detailedItem.ProjectRequirements || {}),
            // Si hay especialidades en el detalle, usarlas; de lo contrario, mantener las existentes
            specialties: detailedItem.ProjectRequirements?.RequirementSpecialty?.map((rs: any) => ({
              id: rs.id,
              specialty: rs.specialty,
              scope: rs.scope,
              subScope: rs.subScope,
              observations: rs.observations
            })) || []
          }
        };
        
        // Actualizar el estado con los detalles completos
        setSelectedRequestDetails(preservedItem);
        
        // Actualizar el item en el array de datos para mantener la coherencia
        // pero preservando la estructura de los datos de requerimientos
        const updatedData = data.map(item => 
          item.id === id ? preservedItem : item
        );
        setData(updatedData);
        
        // Actualizar también los datos filtrados
        const updatedFilteredData = filteredData.map(item => 
          item.id === id ? preservedItem : item
        );
        setFilteredData(updatedFilteredData);
      } else {
        toast.error("No se encontraron detalles para este registro");
        setSelectedRequestDetails(null);
      }
    } catch (error) {
      toast.error("Error al cargar los detalles");
      setSelectedRequestDetails(null);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, itemsPerPage, searchTerm]);

  const handleRowClick = (item: AssignedCompany) => {
    if (expandedId === item.id) {
      // Si ya está expandido, cerrarlo
      setExpandedId(null);
      setSelectedRequestDetails(null);
    } else {
      // Si no está expandido, expandirlo y cargar los detalles
      setExpandedId(item.id);
      loadItemDetails(item.id);
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

    // Obtener el ID del requerimiento directamente del objeto AssignedCompany
    let requirementId: number | undefined;
    
    if (item.projectRequirementsId) {
      requirementId = item.projectRequirementsId;
    } else if (item.ProjectRequirements?.id) {
      requirementId = item.ProjectRequirements.id;
    } else {
      // Si no hay requerimientos específicos, mostramos un mensaje de error
      console.warn("No se encontró un ID de requerimiento específico");
      toast.warning("No se pudo determinar el requerimiento específico");
      return; // No abrimos el modal si no tenemos un requerimiento válido
    }

    // Obtener el nombre del requerimiento
    const requirementName = item.ProjectRequirements?.requirementName || 
                           "Requerimiento " + requirementId;

    setSelectedCompanyForLogs({
      companyId: item.Company.id,
      requirementId: requirementId,
      companyName: item.Company?.comercialName || item.Company?.companyName || "Empresa sin nombre",
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
      toast.error("Error al eliminar el elemento");
    }
  };

  // Manejador para cambiar la cantidad de elementos por página
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Resetear a la primera página cuando cambia el tamaño
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
        companyId={selectedCompanyForLogs?.companyId}
        requirementId={selectedCompanyForLogs?.requirementId}
        requirementName={selectedCompanyForLogs?.requirementName}
        title={`Bitácora - ${selectedCompanyForLogs?.companyName || 'Asociado'}`}
      />
    </>
  );
}
