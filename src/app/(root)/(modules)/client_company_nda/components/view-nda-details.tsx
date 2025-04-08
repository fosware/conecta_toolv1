"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ClientCompanyNDAItem } from "../types/client-company-nda-item";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";

interface ViewNDADetailsProps {
  isOpen: boolean;
  onClose: () => void;
  ndaItem: ClientCompanyNDAItem | null;
}

export function ViewNDADetails({
  isOpen,
  onClose,
  ndaItem,
}: ViewNDADetailsProps) {
  if (!ndaItem) return null;

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

  const handleDownloadNDA = async () => {
    try {
      const response = await fetch(
        `/api/client_company_nda/${ndaItem.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al descargar el NDA");
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
      toast.error(
        error instanceof Error ? error.message : "Error al descargar el NDA"
      );
    }
  };

  const handleDownloadSignedNDA = async () => {
    try {
      const response = await fetch(
        `/api/client_company_nda/${ndaItem.id}/download-signed`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al descargar el NDA firmado");
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
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al descargar el NDA firmado"
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Detalles del NDA</DialogTitle>
          <DialogDescription>
            Información del acuerdo de confidencialidad
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="bg-muted p-6 rounded-lg inline-flex items-center justify-center">
              <FileText className="h-16 w-16 text-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Cliente
              </h3>
              <p className="text-base font-semibold">{ndaItem.clientName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Asociado
              </h3>
              <p className="text-base font-semibold">{ndaItem.companyName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Estado
              </h3>
              <div className="mt-1">
                {ndaItem.ndaSignedFileName ? (
                  <Badge variant="default">Firmado</Badge>
                ) : ndaItem.ndaFileName ? (
                  <Badge variant="secondary">Pendiente de firma</Badge>
                ) : (
                  <Badge variant="destructive">Sin NDA</Badge>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Fecha de Expiración
              </h3>
              <p className="text-base font-semibold">
                {ndaItem.ndaExpirationDate
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
                      const expirationDate = new Date(
                        ndaItem.ndaExpirationDate
                      );
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
                        formatDate(ndaItem.ndaExpirationDate)
                      ) : (
                        <span className="text-destructive font-medium">
                          Expirado: {formatDate(ndaItem.ndaExpirationDate)}
                        </span>
                      );
                    })()
                  : "No definida"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Fecha de Firma
              </h3>
              <p className="text-base">{formatDate(ndaItem.ndaSignedAt)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Documentos
            </h3>
            <div className="flex gap-2">
              {ndaItem.ndaFileName && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadNDA}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar NDA Original
                </Button>
              )}
              {ndaItem.ndaSignedFileName && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSignedNDA}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar NDA Firmado
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
