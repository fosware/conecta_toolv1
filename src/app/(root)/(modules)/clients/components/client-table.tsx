"use client";

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
  Boxes,
  Pencil,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { type Client, type ClientArea } from "@/lib/schemas/client";
import ClientAreasTable from "./client-areas-table";
import React from "react";
import styles from "./client-areas-table.module.css";
import { toast } from "sonner";

interface ClientTableProps {
  clients: Client[];
  isLoading: boolean;
  onEdit: (client: Client) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
  onDelete: (client: Client) => void;
  onManageAreas: (client: Client) => void;
  onRowClick?: (client: Client) => void;
  expandedId?: number | null;
  clientAreas?: ClientArea[];
  loadingAreas?: boolean;
  onEditArea?: (area: ClientArea) => void;
  onDeleteArea?: (area: ClientArea) => void;
}

const ClientTable = ({
  clients,
  isLoading,
  onEdit,
  onToggleStatus,
  onDelete,
  onManageAreas,
  onRowClick,
  expandedId,
  clientAreas = [],
  loadingAreas = false,
  onEditArea,
  onDeleteArea,
}: ClientTableProps) => {
  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await onToggleStatus(id, currentStatus);
    } catch (error) {
      toast.error("Error al actualizar el estado del cliente");
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead className="font-medium">Nombre de la empresa</TableHead>
            <TableHead className="font-medium">RFC</TableHead>
            <TableHead className="font-medium">Dirección fiscal</TableHead>
            <TableHead className="font-medium">Estado</TableHead>
            <TableHead className="text-center font-medium">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <React.Fragment key={client.id}>
              <TableRow
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                onClick={() => onRowClick && onRowClick(client)}
              >
                <TableCell className="p-2">
                  {onRowClick &&
                    (expandedId === client.id ? (
                      <ChevronDown className="h-4 w-4 text-primary" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    ))}
                </TableCell>
                <TableCell>{client.name}</TableCell>
                <TableCell>{client.rfc}</TableCell>
                <TableCell>{client.registered_address}</TableCell>
                <TableCell>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={client.isActive}
                      onCheckedChange={() =>
                        handleToggleStatus(client.id, client.isActive)
                      }
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-1"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar cliente"
                      onClick={() => onEdit(client)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    {/*
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Áreas/Direcciones"
                      onClick={() => onManageAreas(client)}
                      className="h-8 w-8"
                    >
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    */}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Eliminar cliente"
                      onClick={() => onDelete(client)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              {expandedId === client.id && (
                <TableRow>
                  <TableCell colSpan={7} className="p-0 border-t-0">
                    <div className="bg-background p-4 rounded-md mx-4 my-2 border border-border">
                      <div
                        className={`flex justify-between items-center mb-4 ${styles.areasHeader}`}
                      >
                        <h3 className="text-base font-medium flex items-center gap-2">
                          <Boxes className="h-5 w-5 text-muted-foreground" />
                          Áreas / Direcciones de
                          <span className="text-primary font-bold">
                            {client.name}
                          </span>
                        </h3>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => onManageAreas(client)}
                          >
                            <Plus className="h-4 w-4 mr-2 text-muted-foreground" />
                            Nuevo Contacto
                          </Button>
                        </div>
                      </div>
                      <ClientAreasTable
                        areas={clientAreas}
                        isLoading={loadingAreas}
                        compact={true}
                        onEditArea={onEditArea}
                        onDeleteArea={onDeleteArea}
                      />
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
};

export default ClientTable;
