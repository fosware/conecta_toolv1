"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Upload,
  ChevronDown,
  ChevronRight,
  Loader2,
  Eye,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AssignedCompany, Status } from "@/lib/schemas/assigned_company";

interface AssignedCompaniesTableProps {
  data: AssignedCompany[];
  loading: boolean;
  onRowClick: (item: AssignedCompany) => void;
  onUploadNda: (item: AssignedCompany) => void;
  onViewDocuments: (item: AssignedCompany) => void;
  onDeleteItem: (item: AssignedCompany) => void;
  expandedId: number | null;
}

export function AssignedCompaniesTable({
  data,
  loading,
  onRowClick,
  onUploadNda,
  onViewDocuments,
  onDeleteItem,
  expandedId,
}: AssignedCompaniesTableProps) {
  const [downloadingNda, setDownloadingNda] = useState<number | null>(null);

  const handleDownloadNda = async (item: AssignedCompany, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.ndaFile) {
      return;
    }

    try {
      setDownloadingNda(item.id);
      const response = await fetch(`/api/assigned_companies/${item.id}/download-nda`, {
        headers: {
          // Usamos cookies para autenticación
        },
      });

      if (!response.ok) {
        throw new Error("Error al descargar el NDA");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = item.ndaFileName || "nda.pdf";
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading NDA:", error);
    } finally {
      setDownloadingNda(null);
    }
  };

  const getStatusBadge = (status?: Status) => {
    if (!status) return null;

    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    
    switch (status.name) {
      case "Pendiente":
        variant = "outline";
        break;
      case "En Proceso":
        variant = "default";
        break;
      case "Completado":
        variant = "secondary";
        break;
      case "Cancelado":
        variant = "destructive";
        break;
      default:
        variant = "outline";
    }

    return <Badge variant={variant}>{status.name}</Badge>;
  };

  // Función para formatear fecha para mostrar en la tabla
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) throw new Error("Invalid date");
      
      return d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC", // Forzar interpretación UTC
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Fecha inválida";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No hay solicitudes asignadas</p>
      </div>
    );
  }

  // Filtrar solo los elementos que no están eliminados
  const filteredData = data.filter(item => !item.isDeleted);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]"></TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Área/Dirección</TableHead>
            <TableHead>Solicitud</TableHead>
            <TableHead>Fecha Solicitud</TableHead>
            <TableHead>Asociado</TableHead>
            <TableHead>Requerimientos</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((item) => (
            <React.Fragment key={item.id}>
              <TableRow
                className={cn(
                  "cursor-pointer hover:border-primary/50 border",
                  expandedId === item.id && "border-l-4 border-l-primary"
                )}
                onClick={() => onRowClick(item)}
              >
                <TableCell>
                  {expandedId === item.id ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </TableCell>
                <TableCell>
                  {item.ProjectRequest?.clientArea?.client?.name || "N/A"}
                </TableCell>
                <TableCell>
                  {item.ProjectRequest?.clientArea?.areaName || item.ProjectRequest?.clientArea?.name || "N/A"}
                </TableCell>
                <TableCell>
                  {item.ProjectRequest?.title || item.ProjectRequest?.name || "N/A"}
                </TableCell>
                <TableCell>
                  {formatDate(item.ProjectRequest?.requestDate || item.ProjectRequest?.createdAt)}
                </TableCell>
                <TableCell>
                  {item.Company?.comercialName || item.Company?.name || "N/A"}
                </TableCell>
                <TableCell>
                  {item.requirements && item.requirements.length > 0
                    ? item.requirements.map((req) => req.name).join(", ")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {getStatusBadge(item.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUploadNda(item);
                      }}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDocuments(item);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              
              {expandedId === item.id && (
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={9} className="p-0">
                    <div className="grid grid-cols-2 gap-4 p-4">
                      <div>
                        <h3 className="font-semibold mb-2">Detalles de la Solicitud</h3>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-medium">Cliente:</span>{" "}
                            {item.ProjectRequest?.clientArea?.client?.name || "N/A"}
                          </p>
                          <p>
                            <span className="font-medium">Área:</span>{" "}
                            {item.ProjectRequest?.clientArea?.areaName || item.ProjectRequest?.clientArea?.name || "N/A"}
                          </p>
                          <p>
                            <span className="font-medium">Solicitud:</span>{" "}
                            {item.ProjectRequest?.title || item.ProjectRequest?.name || "N/A"}
                          </p>
                          <p>
                            <span className="font-medium">Descripción:</span>{" "}
                            {item.ProjectRequest?.description || "N/A"}
                          </p>
                          <p>
                            <span className="font-medium">Fecha Solicitud:</span>{" "}
                            {formatDate(item.ProjectRequest?.requestDate || item.ProjectRequest?.createdAt)}
                          </p>
                          <p>
                            <span className="font-medium">Asociado:</span>{" "}
                            {item.Company?.comercialName || item.Company?.name || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Estado del NDA</h3>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-medium">NDA Original:</span>{" "}
                            {item.ndaFileName || "No disponible"}
                          </p>
                          <p>
                            <span className="font-medium">NDA Firmado:</span>{" "}
                            {item.ndaSignedFileName || "No disponible"}
                          </p>
                          <p>
                            <span className="font-medium">Estado:</span>{" "}
                            {getStatusBadge(item.status)}
                          </p>
                        </div>
                        <div className="mt-4 flex space-x-2">
                          {item.ndaFileName && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleDownloadNda(item, e)}
                              disabled={downloadingNda === item.id}
                            >
                              {downloadingNda === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <FileText className="h-4 w-4 mr-2" />
                              )}
                              Descargar NDA
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
