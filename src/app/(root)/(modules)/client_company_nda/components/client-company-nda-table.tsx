"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  // Añadir estado para la animación de la tabla
  const [isVisible, setIsVisible] = useState(true);

  // Efecto para animar la tabla cuando cambian los elementos
  useEffect(() => {
    setIsVisible(false);
    // Pequeño retraso para la animación
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    
    return () => clearTimeout(timeout);
  }, [ndaItems]);

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
      console.error("Error formatting date:", error);
      return "Fecha inválida";
    }
  };

  return (
    <div className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'} rounded-md border`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Asociado</TableHead>
            <TableHead>Fecha de Expiración</TableHead>
            <TableHead>Fecha de Creación</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ndaItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                No hay NDAs registrados
              </TableCell>
            </TableRow>
          ) : (
            ndaItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.clientName}</TableCell>
                <TableCell>{item.comercialName || item.companyName}</TableCell>
                <TableCell>
                  {item.ndaExpirationDate
                    ? (() => {
                        // Crear fecha actual
                        const today = new Date();
                        today.setHours(0, 0, 0, 0); // Inicio del día para comparación correcta
                        
                        // Crear fecha de expiración
                        const expirationDate = new Date(item.ndaExpirationDate);
                        expirationDate.setHours(0, 0, 0, 0); // Inicio del día para comparación correcta
                        
                        // Comparar fechas (ignorando la hora)
                        const isExpired = today > expirationDate;
                        
                        return isExpired ? (
                          <span className="text-red-800 dark:text-red-300 font-medium">
                            {formatDate(item.ndaExpirationDate)}{" "}
                            <Badge className="ml-1 bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800">
                              Expirado
                            </Badge>
                          </span>
                        ) : (
                          formatDate(item.ndaExpirationDate)
                        );
                      })()
                    : "N/A"}
                </TableCell>
                <TableCell>{formatDate(item.createdAt)}</TableCell>
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

                    {item.ndaSignedFileName && (
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
