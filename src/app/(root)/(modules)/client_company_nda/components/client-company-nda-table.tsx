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
import { Button } from "@/components/ui/button";
import { Download, FileText, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
// import { format } from "date-fns";
// import { es } from "date-fns/locale";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { ClientCompanyNDAItem } from "../types/client-company-nda-item";

interface ClientCompanyNDATableProps {
  ndaItems: ClientCompanyNDAItem[];
  onEdit: (item: ClientCompanyNDAItem) => void;
  onDelete: (item: ClientCompanyNDAItem) => void;
  onRefresh: () => void;
}

export function ClientCompanyNDATable({
  ndaItems,
  onEdit,
  onDelete,
  onRefresh,
}: ClientCompanyNDATableProps) {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownloadNDA = async (item: ClientCompanyNDAItem) => {
    try {
      setDownloadingId(item.id);
      const response = await fetch(
        `/api/client_company_nda/${item.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al descargar el NDA");
      }

      // Obtener el nombre del archivo de la cabecera de respuesta
      const contentDisposition = response.headers.get("content-disposition");
      let filename = "nda-document.pdf";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("NDA descargado correctamente");
    } catch (error) {
      console.error("Error downloading NDA:", error);
      toast.error("Error al descargar el NDA");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadSignedNDA = async (item: ClientCompanyNDAItem) => {
    try {
      setDownloadingId(item.id);
      const response = await fetch(
        `/api/client_company_nda/${item.id}/download-signed`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al descargar el NDA firmado");
      }

      // Obtener el nombre del archivo de la cabecera de respuesta
      const contentDisposition = response.headers.get("content-disposition");
      let filename = "nda-signed-document.pdf";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("NDA firmado descargado correctamente");
    } catch (error) {
      console.error("Error downloading signed NDA:", error);
      toast.error("Error al descargar el NDA firmado");
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      // Si la fecha ya es un objeto Date, usarlo directamente
      const d = new Date(dateString);
      if (isNaN(d.getTime())) throw new Error("Invalid date");

      // Usar formato español (DD/MM/YYYY)
      return d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC", // Forzar interpretación UTC para evitar problemas con zonas horarias
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Fecha inválida";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Asociado</TableHead>
            <TableHead>Estado NDA</TableHead>
            <TableHead>Expira</TableHead>
            <TableHead>Firma</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ndaItems.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center py-8 text-muted-foreground"
              >
                <div className="flex flex-col items-center justify-center">
                  <FileText className="h-8 w-8 mb-2" />
                  <p>No hay NDA's registrados</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            ndaItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.clientName}</TableCell>
                <TableCell>{item.companyName}</TableCell>
                <TableCell>
                  {item.ndaSignedFileName ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800">
                      Firmado
                    </Badge>
                  ) : item.ndaFileName ? (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800">
                      Pendiente de firma
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800">
                      Sin NDA
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {item.ndaExpirationDate
                    ? (() => {
                        // Crear fechas usando UTC para evitar problemas con zonas horarias
                        const today = new Date();
                        const todayUTC = new Date(
                          Date.UTC(
                            today.getFullYear(),
                            today.getMonth(),
                            today.getDate()
                          )
                        );

                        // Convertir la fecha de expiración a UTC
                        const expirationDate = new Date(item.ndaExpirationDate);
                        const expirationDateUTC = new Date(
                          Date.UTC(
                            expirationDate.getUTCFullYear(),
                            expirationDate.getUTCMonth(),
                            expirationDate.getUTCDate(),
                            23,
                            59,
                            59 // Establecer a final del día para comparación correcta
                          )
                        );

                        // Un NDA se considera válido hasta el final del día de expiración
                        return todayUTC <= expirationDateUTC ? (
                          formatDate(item.ndaExpirationDate)
                        ) : (
                          <span className="text-red-800 dark:text-red-300 font-medium">
                            {formatDate(item.ndaExpirationDate)}{" "}
                            <Badge className="ml-1 bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800">
                              Expirado
                            </Badge>
                          </span>
                        );
                      })()
                    : "N/A"}
                </TableCell>
                <TableCell>{formatDate(item.ndaSignedAt)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(item)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {item.ndaFileName && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadNDA(item)}
                        disabled={downloadingId === item.id}
                        title="Descargar NDA"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {item.ndaSignedFileName && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadSignedNDA(item)}
                        disabled={downloadingId === item.id}
                        title="Descargar NDA firmado"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(item)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
