"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as React from "react";
import ProjectRequestOverview from "./project-request-overview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TableSkeleton } from "@/components/table-skeleton";
import { toast } from "sonner";
import {
  Search,
  Eye,
  Filter,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  FileText,
  Medal,
  Loader2,
  Users,
  ClipboardList,
  Building2,
  ListChecks,
} from "lucide-react";
import { Input } from "@/components/ui/input";

import { ProjectRequestWithRelations } from "@/lib/schemas/project_request";

type ProjectRequest = ProjectRequestWithRelations;

// Función para formatear fecha para mostrar en la tabla
const formatDateForDisplay = (date: string | Date | null) => {
  if (!date) return "N/A";
  try {
    // Si la fecha ya es un objeto Date, usarlo directamente
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) throw new Error("Invalid date");

    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC", // Forzar interpretación UTC
    });
  } catch (error) {
    console.error("Error formatting date:", date, error);
    return "Fecha inválida";
  }
};

interface ProjectRequestsTableProps {
  data?: ProjectRequest[];
  loading?: boolean;
  onEdit?: (item: ProjectRequest) => void;
  onDelete?: (item: ProjectRequest) => void;
  onToggleStatus?: (id: number, currentStatus: boolean) => void;
  onViewDetails?: (item: ProjectRequest) => void;
  onManageRequirements?: (item: ProjectRequest) => void;
  onManageSpecialties?: (requirement: any) => void;
  onManageCertifications?: (requirement: any) => void;
  onManageParticipants?: (requirement: any) => void;
  onRowClick?: (item: ProjectRequest) => void;
  expandedId?: number | null;
  isStaff?: boolean;
  selectedRequestDetails?: ProjectRequest | null;
  onRefreshData?: () => void; // Nueva prop para refrescar datos
}

export function ProjectRequestsTable({
  data,
  loading = false,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewDetails,
  onManageRequirements,
  onManageSpecialties,
  onManageCertifications,
  onManageParticipants,
  onRowClick,
  expandedId = null,
  isStaff = false,
  selectedRequestDetails = null,
  onRefreshData, // Nueva prop para refrescar datos
}: ProjectRequestsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Tabla de ejemplo con datos ficticios si no se proporcionan datos
  const mockData: ProjectRequest[] = [
    {
      id: 1,
      title: "Solicitud de Proyecto 1",
      observation: "Observación de la solicitud 1",
      isActive: true,
      isDeleted: false,
      clientAreaId: 1,
      userId: 1,
      statusId: 1,
      requestDate: "2023-01-01T00:00:00.000Z",
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: "2023-01-01T00:00:00.000Z",
      dateDeleted: null,
      clientArea: {
        id: 1,
        name: "Área de Cliente 1",
        isActive: true,
        isDeleted: false,
        clientId: 1,
        client: {
          id: 1,
          name: "Cliente 1",
          isActive: true,
          isDeleted: false,
        },
      },
      user: {
        id: 1,
        email: "usuario1@example.com",
        username: "usuario1",
      },
    },
    {
      id: 2,
      title: "Solicitud de Proyecto 2",
      observation: "Observación de la solicitud 2",
      isActive: false,
      isDeleted: false,
      clientAreaId: 2,
      userId: 2,
      statusId: 2,
      requestDate: "2023-02-01T00:00:00.000Z",
      createdAt: "2023-02-01T00:00:00.000Z",
      updatedAt: "2023-02-01T00:00:00.000Z",
      dateDeleted: null,
      clientArea: {
        id: 2,
        name: "Área de Cliente 2",
        isActive: true,
        isDeleted: false,
        clientId: 2,
        client: {
          id: 2,
          name: "Cliente 2",
          isActive: true,
          isDeleted: false,
        },
      },
      user: {
        id: 2,
        email: "usuario2@example.com",
        username: "usuario2",
      },
    },
  ];

  // Usar los datos proporcionados o los datos de ejemplo
  const baseData = data || mockData;
  const showActiveColumn = !isStaff;

  // Filtrar los datos según el término de búsqueda
  const tableData = baseData.filter((item) => {
    if (!searchTerm.trim()) return true;

    const searchTermLower = searchTerm.toLowerCase().trim();

    // Buscar en título
    if (item.title && item.title.toLowerCase().includes(searchTermLower))
      return true;

    // Buscar en nombre del cliente
    if (
      item.clientArea?.client?.name &&
      item.clientArea.client.name.toLowerCase().includes(searchTermLower)
    )
      return true;

    // Buscar en área del cliente
    if (
      item.clientArea?.name &&
      item.clientArea.name.toLowerCase().includes(searchTermLower)
    )
      return true;

    // Buscar en observaciones
    if (
      item.observation &&
      item.observation.toLowerCase().includes(searchTermLower)
    )
      return true;

    return false;
  });

  // Función para manejar la visualización de detalles (si no se proporciona)
  const handleViewDetails = (item: ProjectRequest) => {
    if (onViewDetails) {
      onViewDetails(item);
    } else {
      toast.info(`Detalles de la solicitud ${item.id}`, {
        description: "Funcionalidad en desarrollo",
      });
    }
  };

  if (loading) {
    return <TableSkeleton columns={8} rows={5} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center w-full">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar solicitudes..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar por título, cliente, área o observaciones"
            title="Buscar por título, cliente, área o observaciones"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Fecha de petición</TableHead>
              <TableHead>Estado</TableHead>
              {showActiveColumn && <TableHead>Activo</TableHead>}
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : tableData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No hay solicitudes de proyectos disponibles.
                </TableCell>
              </TableRow>
            ) : (
              tableData.map((item) => (
                <React.Fragment key={item.id}>
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRowClick?.(item)}
                        title={
                          expandedId === item.id
                            ? "Contraer detalles"
                            : "Expandir detalles"
                        }
                        className="hover:bg-muted flex items-center gap-1 h-8 px-2"
                      >
                        <FileText className="h-4 w-4" />
                        {expandedId === item.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.clientArea?.client?.name || "No especificado"}</TableCell>
                    <TableCell>
                      {item.clientArea?.contactName || "No especificado"}
                    </TableCell>
                    <TableCell>
                      {formatDateForDisplay(item.requestDate || item.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm ${
                        item.statusId === 17 ? "text-blue-600" : 
                        item.statusId === 18 ? "text-indigo-600" : 
                        item.statusId === 19 ? "text-yellow-600" : 
                        item.statusId === 20 ? "text-orange-600" : 
                        item.statusId === 21 ? "text-red-600" : 
                        item.statusId === 22 ? "text-green-600" : "text-gray-600"
                      }`}>
                        {item.status?.name || "No definido"}
                      </span>
                    </TableCell>
                    {showActiveColumn && (
                      <TableCell>
                        {onToggleStatus && (
                          <Switch
                            checked={item.isActive}
                            onCheckedChange={() =>
                              onToggleStatus(item.id, item.isActive)
                            }
                          />
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(item)}
                            title="Editar solicitud"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {onViewDetails && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(item)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}


                        {onManageRequirements && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onManageRequirements(item)}
                            title="Gestionar requerimientos"
                          >
                            <ListChecks className="h-4 w-4" />
                          </Button>
                        )}

                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => onDelete(item)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedId === item.id && selectedRequestDetails && (
                    <TableRow>
                      <TableCell
                        colSpan={showActiveColumn ? 8 : 7}
                        className="p-0 border-t-0"
                      >
                        <div className="px-4">
                          <ProjectRequestOverview
                            data={selectedRequestDetails}
                            onManageRequirements={onManageRequirements}
                            onManageSpecialties={onManageSpecialties}
                            onManageCertifications={onManageCertifications}
                            onManageParticipants={onManageParticipants}
                            onRefreshData={onRefreshData} // Pasar la función de refresco
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
