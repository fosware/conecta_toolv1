import { useState, Fragment } from "react";
import { type Associate } from "@/lib/schemas/associate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Loader2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";
import { ClipboardDocumentCheck } from "@/components/icons";
import Image from "next/image";

interface AssociatesTableProps {
  data: Associate[];
  loading: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => Promise<void>;
  onManageCertificates: (id: number) => void;
  showOnlyActive: boolean;
}

export function AssociatesTable({
  data,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  onManageCertificates,
  showOnlyActive,
}: AssociatesTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleExpand = (id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const viewNda = async (id: number) => {
    try {
      const response = await fetch(`/api/asociados/${id}/nda`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Error al obtener el NDA");
        return;
      }

      // Crear un blob del PDF y abrirlo en una nueva pestaña
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error("Error al obtener el NDA:", error);
      toast.error("Error al obtener el NDA");
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]"></TableHead>
            <TableHead>Nombre de la Empresa</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No se encontraron asociados
              </TableCell>
            </TableRow>
          ) : (
            data
              .filter((associate) => !showOnlyActive || associate.isActive)
              .map((associate) => (
                <Fragment key={associate.id}>
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleExpand(associate.id)}
                      >
                        {expandedRows[associate.id] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>{associate.companyName}</TableCell>
                    <TableCell>{associate.contactName}</TableCell>
                    <TableCell>{associate.email}</TableCell>
                    <TableCell>{associate.phone}</TableCell>
                    <TableCell>
                      <Switch
                        checked={associate.isActive}
                        onCheckedChange={() =>
                          onToggleStatus(associate.id, associate.isActive)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Certificados"
                          onClick={() => onManageCertificates(associate.id)}
                          className="h-9 w-9 p-0"
                        >
                          <ClipboardDocumentCheck className="h-6 w-6" />
                        </Button>
                        {associate.nda && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewNda(associate.id)}
                            title="Ver NDA"
                          >
                            <FileText className="h-6 w-6" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar asociado"
                          onClick={() => onEdit(associate.id)}
                        >
                          <Pencil className="h-6 w-6" />
                        </Button>
                        <ConfirmationDialog
                          question={`¿Está seguro que desea eliminar el asociado "${associate.companyName}"?`}
                          onConfirm={() => onDelete(associate.id)}
                          trigger={
                            <Button variant="ghost" size="icon" title="Eliminar asociado">
                              <Trash2 className="h-6 w-6" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRows[associate.id] && (
                    <TableRow key={`${associate.id}-expanded`}>
                      <TableCell colSpan={7}>
                        <div className="p-4 bg-muted/50">
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium">Usuarios del Asociado</h4>
                            {/* Aquí irá la lista de usuarios cuando se implemente */}
                            <div className="text-sm text-muted-foreground">
                              No hay usuarios registrados para este asociado.
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // TODO: Implementar la adición de usuarios
                                toast.info("Función en desarrollo");
                              }}
                            >
                              Agregar Usuario
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
