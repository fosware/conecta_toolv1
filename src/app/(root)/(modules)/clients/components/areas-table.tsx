import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { type ClientArea } from "@/lib/schemas/client";

interface AreasTableProps {
  areas: ClientArea[];
  isLoading: boolean;
  onEdit: (area: ClientArea) => void;
  onDelete: (area: ClientArea) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
}

export const AreasTable = ({
  areas,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
}: AreasTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre del área</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {areas.map((area) => (
            <TableRow key={area.id}>
              <TableCell>{area.areaName}</TableCell>
              <TableCell>{area.contactName}</TableCell>
              <TableCell>{area.contactEmail}</TableCell>
              <TableCell>{area.contactPhone}</TableCell>
              <TableCell>
                <Switch
                  checked={area.isActive}
                  onCheckedChange={() =>
                    onToggleStatus(area.id, area.isActive)
                  }
                />
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(area)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(area)}
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

export default AreasTable;
