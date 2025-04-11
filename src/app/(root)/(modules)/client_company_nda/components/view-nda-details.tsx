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
      const d = new Date(dateString);
      if (isNaN(d.getTime())) throw new Error("Invalid date");

      // Formatear fecha de forma simple
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      
      return `${day}/${month}/${year}`;
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalles del NDA</DialogTitle>
          <DialogDescription>
            Información detallada del NDA entre {ndaItem.clientName} y{" "}
            {ndaItem.companyName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
                      // Crear fecha actual
                      const today = new Date();
                      today.setHours(0, 0, 0, 0); // Inicio del día para comparación correcta
                      
                      // Crear fecha de expiración
                      const expirationDate = new Date(ndaItem.ndaExpirationDate);
                      expirationDate.setHours(0, 0, 0, 0); // Inicio del día para comparación correcta
                      
                      // Comparar fechas (ignorando la hora)
                      const isExpired = today > expirationDate;
                      
                      return isExpired ? (
                        <span className="text-destructive font-medium">
                          Expirado: {formatDate(ndaItem.ndaExpirationDate)}
                        </span>
                      ) : (
                        formatDate(ndaItem.ndaExpirationDate)
                      );
                    })()
                  : "No definida"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Fecha de Creación
              </h3>
              <p className="text-base">{formatDate(ndaItem.createdAt)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Documento
            </h3>
            <div className="flex gap-2">
              {ndaItem.ndaSignedFileName && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadNDA}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar NDA
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
