import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow as BaseTableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { type ClientArea } from "@/lib/schemas/client";
import React from "react";
import { cn } from "@/lib/utils";
import styles from "./client-areas-table.module.css";

// Función para formatear números telefónicos en el formato XX-XXXX-XXXX
const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return "";
  
  // Eliminar cualquier caracter no numérico
  const cleaned = phone.replace(/\D/g, "");
  
  // Verificar que tengamos 10 dígitos
  if (cleaned.length !== 10) return phone;
  
  // Formatear como XX-XXXX-XXXX
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`;
};

// Componente TableRow personalizado sin hover para las áreas
const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { noHover?: boolean }
>(({ className, noHover, ...props }, ref) => (
  <BaseTableRow
    ref={ref}
    className={cn(
      className,
      noHover ? styles.noHoverRow : ""
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

interface ClientAreasTableProps {
  areas: ClientArea[];
  isLoading: boolean;
  onEdit?: (area: ClientArea) => void;
  onDelete?: (area: ClientArea) => void;
  onToggleStatus?: (id: number, currentStatus: boolean) => void;
  compact?: boolean;
  onEditArea?: (area: ClientArea) => void;
  onDeleteArea?: (area: ClientArea) => void;
}

export const ClientAreasTable = ({
  areas,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
  compact = false,
  onEditArea,
  onDeleteArea,
}: ClientAreasTableProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">Cargando áreas...</span>
      </div>
    );
  }

  if (areas.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No hay áreas registradas para este cliente.
      </div>
    );
  }

  return (
    <div className={compact ? "" : "rounded-md border"}>
      <div>
        <Table className={compact ? "border-collapse" : ""}>
          <TableHeader>
            <TableRow className={compact ? "bg-transparent border-b border-border" : ""}>
              <TableHead className={compact ? "text-muted-foreground font-medium py-2" : ""}>Nombre del área</TableHead>
              <TableHead className={compact ? "text-muted-foreground font-medium py-2" : ""}>Contacto</TableHead>
              <TableHead className={compact ? "text-muted-foreground font-medium py-2" : ""}>Email</TableHead>
              <TableHead className={compact ? "text-muted-foreground font-medium py-2" : ""}>Teléfono</TableHead>
              {!compact && <TableHead>Estado</TableHead>}
              <TableHead className={compact ? "text-muted-foreground font-medium py-2 text-center" : "text-center"}>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas.map((area) => (
              <TableRow 
                key={area.id} 
                noHover={compact}
                className={compact ? "border-b border-border last:border-0" : ""}
              >
                <TableCell className={compact ? "py-3" : ""}>{area.areaName}</TableCell>
                <TableCell className={compact ? "py-3" : ""}>{area.contactName}</TableCell>
                <TableCell className={compact ? "py-3" : ""}>{area.contactEmail}</TableCell>
                <TableCell className={compact ? "py-3" : ""}>{formatPhoneNumber(area.contactPhone)}</TableCell>
                {!compact && onToggleStatus && (
                  <TableCell>
                    <Switch
                      checked={area.isActive}
                      onCheckedChange={() =>
                        onToggleStatus(area.id, area.isActive)
                      }
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex justify-center gap-1">
                    {(onEdit || onEditArea) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => compact && onEditArea ? onEditArea(area) : onEdit && onEdit(area)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                    {(onDelete || onDeleteArea) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => compact && onDeleteArea ? onDeleteArea(area) : onDelete && onDelete(area)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClientAreasTable;
