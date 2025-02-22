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
import { Boxes, Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { type Client } from "@/lib/schemas/client";
import { toast } from "sonner";

interface ClientTableProps {
  clients: Client[];
  isLoading: boolean;
  onEdit: (client: Client) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
  onDelete: (client: Client) => void;
  onManageAreas: (client: Client) => void;
}

const ClientTable = ({
  clients,
  isLoading,
  onEdit,
  onToggleStatus,
  onDelete,
  onManageAreas,
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
            <TableHead>Nombre de la empresa</TableHead>
            <TableHead>RFC</TableHead>
            <TableHead>Dirección fiscal</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>{client.name}</TableCell>
              <TableCell>{client.rfc}</TableCell>
              <TableCell>{client.registered_address}</TableCell>
              <TableCell>
                <Switch
                  checked={client.isActive}
                  onCheckedChange={() =>
                    handleToggleStatus(client.id, client.isActive)
                  }
                />
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Editar cliente"
                    onClick={() => onEdit(client)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Áreas/Direcciones"
                    onClick={() => onManageAreas(client)}
                  >
                    <Boxes className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Eliminar cliente"
                    onClick={() => onDelete(client)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClientTable;
