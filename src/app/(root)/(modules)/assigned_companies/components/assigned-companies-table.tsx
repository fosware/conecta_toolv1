"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  FileText,
  Upload,
  ChevronDown,
  ChevronRight,
  Eye,
  Trash2,
  Clock as HourglassIcon,
  Users,
  FileSignature,
  CheckSquare,
  AlertCircle,
  CheckCircle2,
  Download,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AssignedCompany, Status } from "@/lib/schemas/assigned_company";
import { UploadQuoteDialog } from "./upload-quote-dialog";
import { toast } from "sonner";
import UnreadIndicator from "@/app/(root)/(modules)/project_request_logs/components/unread-indicator";

interface AssignedCompaniesTableProps {
  data: AssignedCompany[];
  loading: boolean;
  onRowClick: (item: AssignedCompany) => void;
  onViewDocuments: (item: AssignedCompany) => void;
  onDeleteItem: (item: AssignedCompany) => void;
  onRefreshData: (showLoading: boolean) => void;
  expandedId: number | null;
  onOpenLogs: (item: AssignedCompany) => void;
}

export function AssignedCompaniesTable({
  data,
  loading,
  onRowClick,
  onViewDocuments,
  onDeleteItem,
  onRefreshData,
  expandedId,
  onOpenLogs,
}: AssignedCompaniesTableProps) {
  const [downloadingQuote, setDownloadingQuote] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AssignedCompany | null>(
    null
  );
  const [uploadQuoteDialogOpen, setUploadQuoteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AssignedCompany | null>(
    null
  );
  const [companiesWithQuotations, setCompaniesWithQuotations] = useState<Record<number, boolean>>({});
  const [requirementsWithDocuments, setRequirementsWithDocuments] = useState<Record<number, boolean>>({});

  // Obtener el item expandido de los datos
  const expandedItem = data.find(item => item.id === expandedId);
  
  // Verificar la disponibilidad de documentos técnicos cuando cambian los datos
  React.useEffect(() => {
    if (data.length > 0) {
      checkDocumentsAvailability();
    }
  }, [data]);
  
  // Función para verificar la disponibilidad de documentos técnicos
  const checkDocumentsAvailability = async () => {
    try {
      // Crear un mapa para almacenar la disponibilidad de documentos
      const docsAvailabilityMap: Record<number, boolean> = {};
      
      // Para cada item, verificar si hay documentos técnicos disponibles
      for (const item of data) {
        // Obtener el ID de la solicitud de proyecto
        const projectRequestId = item.ProjectRequest?.id;
        if (!projectRequestId) continue;
        
        // Si ya verificamos este projectRequestId, reutilizar el resultado
        if (docsAvailabilityMap[projectRequestId] !== undefined) {
          docsAvailabilityMap[item.id] = docsAvailabilityMap[projectRequestId];
          continue;
        }
        
        // Verificar si hay documentos técnicos para esta solicitud
        const response = await fetch(`/api/project_requests/${projectRequestId}/documents`);
        
        if (response.ok) {
          const responseData = await response.json();
          const hasDocuments = Array.isArray(responseData.documents) && responseData.documents.length > 0;
          
          // Guardar el resultado para este projectRequestId y para este item
          docsAvailabilityMap[projectRequestId] = hasDocuments;
          docsAvailabilityMap[item.id] = hasDocuments;
        } else {
          docsAvailabilityMap[item.id] = false;
        }
      }
      
      setRequirementsWithDocuments(docsAvailabilityMap);
    } catch (error) {
      console.error("Error checking documents availability:", error);
    }
  };

  const handleDownloadQuote = async (item: AssignedCompany) => {
    try {
      setDownloadingQuote(item.id);
      
      // Primero, obtener el nombre del archivo de la cotización
      const quoteInfoResponse = await fetch(
        `/api/assigned_companies/${item.id}/quotation-info`
      );

      if (!quoteInfoResponse.ok) {
        throw new Error("Error al obtener información de la cotización");
      }

      const quoteInfo = await quoteInfoResponse.json();

      // Verificar si la cotización está disponible
      if (!quoteInfo.available) {
        toast.warning("No hay cotización disponible para descargar");
        return;
      }

      const fileName = quoteInfo.quotationFileName || `cotizacion-${item.id}.xlsx`;

      // Luego, descargar el archivo
      const response = await fetch(
        `/api/assigned_companies/${item.id}/download-quote`
      );

      if (!response.ok) {
        throw new Error("Error al descargar la cotización");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = fileName;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      // Eliminar console.error y mantener solo el toast para el usuario
      toast.error("Error al descargar la cotización");
    } finally {
      setDownloadingQuote(null);
    }
  };

  const getStatusBadgeStyles = (statusId: number) => {
    switch (statusId) {
      case 1: // Procesando
        return "bg-gray-50 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300";
      case 2: // Asociado seleccionado
        return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case 3: // En espera de firma NDA
        return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      case 4: // Firmado por Asociado
        return "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case 5: // Espera de Documentos Técnicos
        return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case 6: // Finalizado
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case 7: // Cotización enviada
        return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case 8: // No seleccionado
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case 9: // Revisión Ok
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-50 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300";
    }
  };

  const getStatusBadge = (status?: Status) => {
    if (!status) return null;

    let variant: "default" | "secondary" | "destructive" | "outline" =
      "default";

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

  const getStatusIcon = (statusId: number) => {
    switch (statusId) {
      case 1: // Procesando
        return (
          <HourglassIcon className="w-3 h-3 text-blue-500 dark:text-blue-400 mr-1" />
        );
      case 2: // Asociado seleccionado
        return (
          <Users className="w-3 h-3 text-blue-500 dark:text-blue-400 mr-1" />
        );
      case 3: // En espera de firma NDA
        return (
          <FileSignature className="w-3 h-3 text-amber-500 dark:text-amber-400 mr-1" />
        );
      case 4: // Firmado por Asociado
        return (
          <CheckSquare className="w-3 h-3 text-purple-500 dark:text-purple-400 mr-1" />
        );
      case 5: // Espera de Documentos Técnicos
        return (
          <AlertCircle className="w-3 h-3 text-orange-500 dark:text-orange-400 mr-1" />
        );
      case 6: // Finalizado
        return (
          <CheckSquare className="w-3 h-3 text-green-500 dark:text-green-400 mr-1" />
        );
      case 7: // Cotización enviada
        return (
          <FileText className="w-3 h-3 text-blue-500 dark:text-blue-400 mr-1" />
        );
      // Cotización rechazada por el Cliente - puede ser ID 8, 12 o cualquier otro
      case 8:
      case 12:
      case 15:
        return (
          <span className="text-red-600 dark:text-red-500 mr-1 font-bold text-base">
            ✗
          </span>
        );
      // Cotización aprobada por el Cliente - puede ser ID 9, 10, 11, 14 o cualquier otro
      case 9:
      case 10:
      case 11:
      case 14:
      case 16:
        return (
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
        );
      default:
        return (
          <CheckCircle2 className="w-3 h-3 text-gray-500 dark:text-gray-400 mr-1" />
        );
    }
  };

  const formatDate = (dateValue?: Date | string) => {
    if (!dateValue) return "N/A";
    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      if (isNaN(date.getTime())) return "N/A";
      
      return date.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "UTC", // Evitar problemas de zona horaria
      });
    } catch (error) {
      return "N/A";
    }
  };

  const shouldShowQuoteButton = (item: AssignedCompany) => {
    // Verificar si el estado permite subir cotización
    // Incluimos el estado 2 (Asociado Seleccionado) y excluimos el estado 8 (No seleccionado)
    const validStatus = item.status && [2, 6, 7, 9].includes(item.status.id);
    
    // Verificar si hay documentos técnicos disponibles para este requerimiento
    const hasDocuments = requirementsWithDocuments[item.id] === true;
    
    // NOTA: Temporalmente deshabilitada la validación de NDA firmado
    // ya que la propiedad hasNDA no está siendo asignada correctamente
    // const hasNDA = (item as any).hasNDA === true;
    
    // Solo mostrar el botón si: 
    // 1. El estado es válido
    // 2. Hay documentos técnicos disponibles
    // (Temporalmente no se valida el NDA firmado)
    return validStatus && hasDocuments; // && hasNDA;
  };

  const handleUploadQuote = (item: AssignedCompany) => {
    setSelectedItem(item);
    setUploadQuoteDialogOpen(true);
  };

  const handleQuoteUploaded = async (updatedItemId?: number) => {
    // Recargar los datos sin mostrar el indicador de carga
    if (onRefreshData) {
      onRefreshData(false);
    }
    
    // Si tenemos el ID del item actualizado y es el mismo que está expandido actualmente
    if (updatedItemId && expandedId === updatedItemId) {
      // Primero, actualizar optimistamente el estado del item en la UI
      // Esto mostrará inmediatamente que la cotización está disponible
      const updatedItem = data.find(item => item.id === updatedItemId);
      if (updatedItem && updatedItem.status) {
        // Si el estado es menor a 5 (cotización disponible), actualizarlo a 5
        if (updatedItem.status.id < 5) {
          // Esto es una actualización optimista, los datos reales vendrán con onRefreshData
          toast.success("Cotización subida correctamente");
        }
      }
      
      // Simular un clic en el botón de bitácora para refrescar los datos de logs
      // Usamos un timeout para asegurar que la UI se haya actualizado
      setTimeout(() => {
        const logsButton = document.querySelector(`[data-logs-button="${updatedItemId}"]`);
        if (logsButton) {
          (logsButton as HTMLButtonElement).click();
        } else {
          // Si no se encuentra el botón, intentar abrir los logs directamente
          const item = data.find(i => i.id === updatedItemId);
          if (item && onOpenLogs) {
            onOpenLogs(item);
          }
        }
      }, 500);
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

  // Filtrar los datos para mostrar solo los activos
  const filteredData = data.filter(
    (item) => item.isActive !== false
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]"></TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Área/Dirección</TableHead>
            <TableHead>Solicitud</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Asociado</TableHead>
            <TableHead>Requerimientos</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
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
                <TableCell className="py-2">
                  {item.ProjectRequest?.clientArea?.client?.name || "N/A"}
                </TableCell>
                <TableCell className="py-2">
                  {item.ProjectRequest?.clientArea?.areaName || "N/A"}
                </TableCell>
                <TableCell className="py-2">
                  {item.ProjectRequest?.title || "N/A"}
                </TableCell>
                <TableCell className="py-2">
                  {formatDate(item.createdAt)}
                </TableCell>
                <TableCell className="py-2">
                  {item.Company?.companyName || "N/A"}
                </TableCell>
                <TableCell className="py-2">
                  {item.ProjectRequirements?.requirementName || item.requirementName || "N/A"}
                </TableCell>
                <TableCell>
                  {item.status && (
                    <Badge
                      className={`flex items-center space-x-1 border-0 pointer-events-none ${getStatusBadgeStyles(item.status.id)}`}
                    >
                      {getStatusIcon(item.status.id)}
                      <span>{item.status.name}</span>
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    {item.status && shouldShowQuoteButton(item) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Subir cotización"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUploadQuote(item);
                        }}
                        className="h-8 w-8"
                      >
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Ver documentos"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDocuments(item);
                      }}
                      className="h-8 w-8"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      title="Ver bitácora"
                      data-logs-button={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenLogs(item);
                      }}
                      className="h-8 w-8"
                    >
                      <div className="relative">
                        <MessageSquare className="h-4 w-4" />
                        {item.ProjectRequest?.id && item.companyId && item.projectRequirementsId && (
                          <UnreadIndicator
                            projectRequestId={item.ProjectRequest.id}
                            companyId={item.companyId}
                            requirementId={item.projectRequirementsId}
                          />
                        )}
                      </div>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>

              {expandedId === item.id && (
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={9} className="p-0 border-t-0">
                    {expandedItem && 'loading' in expandedItem && expandedItem.loading ? (
                      <div className="px-4">
                        <div className="p-6 bg-card rounded-lg shadow-lg mt-4 mb-6 flex justify-center items-center">
                          <div className="flex flex-col items-center space-y-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Cargando detalles...</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="px-4">
                        <div className="p-6 bg-card rounded-lg shadow-lg mt-4 mb-6">
                          <div className="flex justify-between items-start mb-4">
                            <div></div>{" "}
                            {/* Espacio vacío para mantener la alineación */}
                            {item.status && (
                              <Badge
                                className={`flex items-center space-x-1 border-0 pointer-events-none ${getStatusBadgeStyles(item.status.id)}`}
                              >
                                {getStatusIcon(item.status.id)}
                                <span>{item.status.name}</span>
                              </Badge>
                            )}
                          </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <h3 className="font-semibold mb-2 border-b p-1 text-center bg-slate-500 text-slate-100 dark:bg-slate-800">
                              Detalles de la Solicitud
                            </h3>
                            <div className="space-y-1 text-sm p-1">
                              <p>
                                <span className="font-semibold">Cliente:</span>{" "}
                                {item.ProjectRequest?.clientArea?.client?.name ||
                                  "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">Área:</span>{" "}
                                {item.ProjectRequest?.clientArea?.areaName || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">Proyecto:</span>{" "}
                                {item.ProjectRequest?.title || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">
                                  Fecha de Asignación:
                                </span>{" "}
                                {formatDate(item.createdAt)}
                              </p>
                              <p>
                                <span className="font-semibold">
                                  Última Actualización:
                                </span>{" "}
                                {formatDate(item.updatedAt)}
                              </p>
                              <p>
                                <span className="font-semibold">
                                  Fecha Solicitud:
                                </span>{" "}
                                {formatDate(item.updatedAt)}
                              </p>
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2 border-b p-1 text-center bg-slate-500 text-slate-100 dark:bg-slate-800">
                              Requerimientos
                            </h3>
                            <div className="space-y-1 text-sm p-1">
                              {item.ProjectRequirements ? (
                                <div className="mb-2 pb-2 border-b last:border-0">
                                  <p className="font-medium">{item.ProjectRequirements.requirementName}</p>
                                  
                                  {/* Verificar si hay especialidades en el formato directo o en RequirementSpecialty */}
                                  {(item.ProjectRequirements.specialties && item.ProjectRequirements.specialties.length > 0) ? (
                                    <div className="mt-1">
                                      <p className="text-xs font-semibold text-muted-foreground">
                                        Especialidades:
                                      </p>
                                      <ul className="list-disc pl-4 text-xs">
                                        {item.ProjectRequirements.specialties.map(
                                          (spec, idx) => (
                                            <li key={idx}>
                                              {spec.specialty?.name || "N/A"}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  ) : ((item.ProjectRequirements as any).RequirementSpecialty && (item.ProjectRequirements as any).RequirementSpecialty.length > 0) ? (
                                    <div className="mt-1">
                                      <p className="text-xs font-semibold text-muted-foreground">
                                        Especialidades:
                                      </p>
                                      <ul className="list-disc pl-4 text-xs">
                                        {((item.ProjectRequirements as any).RequirementSpecialty as any[]).map(
                                          (rs, idx) => (
                                            <li key={idx}>
                                              {rs.specialty?.name || "N/A"}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  ) : null}
                                  
                                  {/* Mostrar certificaciones si están disponibles */}
                                  {((item.ProjectRequirements as any).RequirementCertification && (item.ProjectRequirements as any).RequirementCertification.length > 0) ? (
                                    <div className="mt-3">
                                      <p className="text-xs font-semibold text-muted-foreground">
                                        Certificaciones:
                                      </p>
                                      <ul className="list-disc pl-4 text-xs">
                                        {((item.ProjectRequirements as any).RequirementCertification as any[]).map(
                                          (cert, idx) => (
                                            <li key={idx}>
                                              {cert.certification?.name || "N/A"}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  ) : null}
                                </div>
                              ) : (
                                <p className="text-muted-foreground">
                                  No hay requerimientos disponibles
                                </p>
                              )}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2 border-b p-1 text-center bg-slate-500 text-slate-100 dark:bg-slate-800">
                              Cotización
                            </h3>
                            <div className="space-y-1 text-sm p-1">
                              {item.status && item.status.id >= 5 ? (
                                <p>
                                  <span className="font-semibold">
                                    Estado:
                                  </span>{" "}
                                  Cotización disponible
                                </p>
                              ) : (
                                <p className="text-muted-foreground">
                                  Pendiente de cotización
                                </p>
                              )}
                              <div className="mt-4">
                                {item.status && item.status.id >= 5 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadQuote(item)}
                                    disabled={downloadingQuote === item.id}
                                    className="w-full"
                                  >
                                    {downloadingQuote === item.id ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4 mr-2" />
                                    )}
                                    Descargar Cotización
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
      {uploadQuoteDialogOpen && selectedItem && (
        <UploadQuoteDialog
          open={uploadQuoteDialogOpen}
          onOpenChange={setUploadQuoteDialogOpen}
          item={selectedItem}
          onSuccess={handleQuoteUploaded}
        />
      )}
    </div>
  );
}
