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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TableSkeleton } from "@/components/table-skeleton";
import { toast } from "sonner";
import { Search, Eye, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ProjectRequestsTable() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Tabla de ejemplo con datos ficticios
  const mockData = [
    {
      id: 1,
      title: "Proyecto de Ejemplo 1",
      clientName: "Cliente A",
      areaName: "Área de Producción",
      status: "Pendiente",
      createdAt: new Date().toLocaleDateString(),
    },
    {
      id: 2,
      title: "Proyecto de Ejemplo 2",
      clientName: "Cliente B",
      areaName: "Área de Logística",
      status: "En Revisión",
      createdAt: new Date().toLocaleDateString(),
    },
  ];

  // Función para manejar la visualización de detalles (a implementar)
  const handleViewDetails = (id: number) => {
    toast.info(`Detalles de la solicitud ${id}`, {
      description: "Funcionalidad en desarrollo"
    });
  };

  if (loading) {
    return <TableSkeleton columns={5} rows={5} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar solicitudes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => toast.info("Filtros", { description: "Funcionalidad en desarrollo" })}>
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha de Creación</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockData.length > 0 ? (
              mockData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{item.clientName}</TableCell>
                  <TableCell>{item.areaName}</TableCell>
                  <TableCell>
                    <Badge
                      variant={item.status === "Pendiente" ? "outline" : "default"}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.createdAt}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetails(item.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No hay solicitudes de proyectos disponibles.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
