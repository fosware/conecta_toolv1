"use client";

import React, { useState } from "react";
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

interface AssignedCompaniesTableProps {
  data: AssignedCompany[];
  loading: boolean;
  onRowClick: (item: AssignedCompany) => void;
  onUploadNda: (item: AssignedCompany) => void;
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
  onUploadNda,
  onViewDocuments,
  onDeleteItem,
  onRefreshData,
  expandedId,
  onOpenLogs,
}: AssignedCompaniesTableProps) {
  const [downloadingNda, setDownloadingNda] = useState<number | null>(null);
  const [downloadingSignedNda, setDownloadingSignedNda] = useState<
    number | null
  >(null);
  const [downloadingQuote, setDownloadingQuote] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AssignedCompany | null>(
    null
  );
  const [uploadQuoteDialogOpen, setUploadQuoteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AssignedCompany | null>(
    null
  );

  const handleDownloadNda = async (
    item: AssignedCompany,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!item.ndaFile) {
      return;
    }

    try {
      setDownloadingNda(item.id);
      const response = await fetch(
        `/api/assigned_companies/${item.id}/download-nda`,
        {
          headers: {
            // Usamos cookies para autenticación
          },
        }
      );

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

  const handleDownloadSignedNda = async (
    item: AssignedCompany,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!item.ndaSignedFile) {
      return;
    }

    try {
      setDownloadingSignedNda(item.id);
      const response = await fetch(
        `/api/assigned_companies/${item.id}/download-nda-signed`,
        {
          headers: {
            // Usamos cookies para autenticación
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al descargar el NDA firmado");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = item.ndaSignedFileName || "nda_signed.pdf";
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading signed NDA:", error);
    } finally {
      setDownloadingSignedNda(null);
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

      const fileName =
        quoteInfo.quotationFileName || `cotizacion-${item.id}.xlsx`;

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
      console.error("Error downloading quote:", error);
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
      case 8: // Cotización rechazada
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
      default:
        return (
          <CheckCircle2 className="w-3 h-3 text-gray-500 dark:text-gray-400 mr-1" />
        );
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) throw new Error("Invalid date");

      return d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC", // Forzar interpretación UTC
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Fecha inválida";
    }
  };

  const shouldShowQuoteButton = (statusId: number) => {
    // Mostrar el botón para los estados: "Documentos técnicos enviados", "Cotización enviada", "Cotización rechazada", "Cotización aprobada"
    return [6, 7, 8, 9].includes(statusId);
  };

  const handleUploadQuote = (item: AssignedCompany) => {
    setSelectedItem(item);
    setUploadQuoteDialogOpen(true);
  };

  const handleQuoteUploaded = () => {
    // Recargar los datos sin mostrar el indicador de carga
    if (onRefreshData) {
      onRefreshData(false);
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

  const filteredData = data.filter((item) => !item.isDeleted);

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
                <TableCell>
                  {item.ProjectRequest?.clientArea?.client?.name || "N/A"}
                </TableCell>
                <TableCell>
                  {item.ProjectRequest?.clientArea?.areaName ||
                    item.ProjectRequest?.clientArea?.name ||
                    "N/A"}
                </TableCell>
                <TableCell>
                  {item.ProjectRequest?.title ||
                    item.ProjectRequest?.name ||
                    "N/A"}
                </TableCell>
                <TableCell>
                  {formatDate(
                    item.ProjectRequest?.requestDate ||
                      item.ProjectRequest?.createdAt
                  )}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Subir NDA"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUploadNda(item);
                      }}
                      className="h-8 w-8"
                    >
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    {item.status && shouldShowQuoteButton(item.status.id) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Cotizar"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUploadQuote(item);
                        }}
                        className="h-8 w-8"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
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
                      title="Bitácora"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenLogs(item);
                      }}
                      className="h-8 w-8"
                    >
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>

              {expandedId === item.id && (
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={9} className="p-0 border-t-0">
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
                                {item.ProjectRequest?.clientArea?.client
                                  ?.name || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">Área:</span>{" "}
                                {item.ProjectRequest?.clientArea?.areaName ||
                                  item.ProjectRequest?.clientArea?.name ||
                                  "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">
                                  Solicitud:
                                </span>{" "}
                                {item.ProjectRequest?.title ||
                                  item.ProjectRequest?.name ||
                                  "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">
                                  Descripción:
                                </span>{" "}
                                {item.ProjectRequest?.description || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">
                                  Fecha Solicitud:
                                </span>{" "}
                                {formatDate(
                                  item.ProjectRequest?.requestDate ||
                                    item.ProjectRequest?.createdAt
                                )}
                              </p>
                              <p>
                                <span className="font-semibold">
                                  Observaciones:
                                </span>{" "}
                                {item.ProjectRequest?.observation ||
                                  "Sin observaciones"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2 border-b p-1 text-center bg-slate-500 text-slate-100 dark:bg-slate-800">
                              Detalles del Requerimiento
                            </h3>
                            <div className="space-y-1 text-sm p-1">
                              {item.requirements &&
                              item.requirements.length > 0 ? (
                                item.requirements.map((req, index) => (
                                  <div key={index} className="mb-4">
                                    <p>
                                      <span className="font-semibold">
                                        Nombre:
                                      </span>{" "}
                                      {req.name || "N/A"}
                                    </p>

                                    {/* Certificaciones */}
                                    {req.certifications &&
                                      req.certifications.length > 0 && (
                                        <div className="mt-2">
                                          <p className="font-semibold">
                                            Certificaciones:
                                          </p>
                                          <ul className="list-disc pl-5 mt-1">
                                            {req.certifications.map(
                                              (cert: any, idx: number) => (
                                                <li key={idx}>
                                                  {cert.certification?.name ||
                                                    "N/A"}
                                                  {cert.observation && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                      <span className="font-semibold">
                                                        Observación:
                                                      </span>{" "}
                                                      {cert.observation}
                                                    </p>
                                                  )}
                                                </li>
                                              )
                                            )}
                                          </ul>
                                        </div>
                                      )}

                                    {/* Especialidades */}
                                    {req.specialties &&
                                      req.specialties.length > 0 && (
                                        <div className="mt-2">
                                          <p className="font-semibold">
                                            Especialidades:
                                          </p>
                                          <ul className="list-disc pl-5 mt-1">
                                            {req.specialties.map(
                                              (spec: any, idx: number) => (
                                                <li key={idx}>
                                                  {spec.specialty?.name ||
                                                    "N/A"}
                                                  {spec.observation && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                      <span className="font-semibold">
                                                        Observación:
                                                      </span>{" "}
                                                      {spec.observation}
                                                    </p>
                                                  )}
                                                </li>
                                              )
                                            )}
                                          </ul>
                                        </div>
                                      )}
                                  </div>
                                ))
                              ) : (
                                <p>No hay requerimientos disponibles</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2 border-b p-1 text-center bg-slate-500 text-slate-100 dark:bg-slate-800">
                              NDA
                            </h3>
                            <div className="space-y-1 text-sm p-1">
                              {item.ndaFileName && (
                                <p>
                                  <span className="font-semibold">
                                    NDA Original:
                                  </span>{" "}
                                  {item.ndaFileName}
                                </p>
                              )}
                              {item.ndaSignedFileName && (
                                <p>
                                  <span className="font-semibold">
                                    NDA Firmado:
                                  </span>{" "}
                                  {item.ndaSignedFileName}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col space-y-2 mt-3">
                              {item.ndaFileName && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => handleDownloadNda(item, e)}
                                  disabled={downloadingNda === item.id}
                                  className="text-xs"
                                >
                                  {downloadingNda === item.id ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <Download className="h-3 w-3 mr-1" />
                                  )}
                                  Descargar NDA
                                </Button>
                              )}
                              {item.ndaSignedFileName && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) =>
                                    handleDownloadSignedNda(item, e)
                                  }
                                  disabled={downloadingSignedNda === item.id}
                                  className="text-xs"
                                >
                                  {downloadingSignedNda === item.id ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <Download className="h-3 w-3 mr-1" />
                                  )}
                                  Descargar NDA Firmado
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Cotización */}
                          <div className="col-span-3 mt-4 pt-4 border-t">
                            <h3 className="font-bold mb-2 text-center bg-slate-500 text-slate-100 dark:bg-slate-800 p-1">
                              Cotización
                            </h3>
                            <div className="flex justify-between items-center">
                              <div className="space-y-1 text-sm">
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
                              </div>
                              <div>
                                {item.status && item.status.id >= 5 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadQuote(item)}
                                    disabled={downloadingQuote === item.id}
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
