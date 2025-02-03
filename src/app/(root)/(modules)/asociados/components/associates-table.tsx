import { useState, Fragment } from "react";
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
import { Pencil, Trash2, ChevronDown, ChevronUp, FileText, Settings } from "lucide-react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";
import { ClipboardDocumentCheck } from "@/components/icons";
import Image from "next/image";

interface AssociatesTableProps {
  associates: any[]; // TODO: Definir tipo correcto
  loading: boolean;
  onEdit: (associate: any) => void; // TODO: Definir tipo correcto
  onManageCertificates: (id: number) => void;
  onManageSpecialties: (id: number) => void;
  showOnlyActive: boolean;
  onSuccess: () => void;
}

export function AssociatesTable({
  associates,
  loading,
  onEdit,
  onManageCertificates,
  onManageSpecialties,
  showOnlyActive,
  onSuccess,
}: AssociatesTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [loadingStatus, setLoadingStatus] = useState<Record<number, boolean>>({});
  const [loadingDelete, setLoadingDelete] = useState<Record<number, boolean>>({});

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleStatus = async (id: number) => {
    try {
      setLoadingStatus((prev) => ({ ...prev, [id]: true }));

      const response = await fetch(`/api/asociados/${id}/toggle-status`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cambiar el estado");
      }

      toast.success("Estado actualizado correctamente");
      onSuccess(); // Recargar la tabla
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al cambiar el estado"
      );
    } finally {
      setLoadingStatus((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setLoadingDelete((prev) => ({ ...prev, [id]: true }));

      const response = await fetch(`/api/asociados/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar el asociado");
      }

      toast.success("Asociado eliminado correctamente");
      onSuccess(); // Recargar la tabla
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar el asociado"
      );
    } finally {
      setLoadingDelete((prev) => ({ ...prev, [id]: false }));
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
            <TableHead className="w-10"></TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {associates.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No se encontraron asociados{" "}
                {showOnlyActive ? "activos" : ""}
              </TableCell>
            </TableRow>
          ) : (
            associates
              .filter((associate) => !showOnlyActive || associate.isActive)
              .map((associate) => (
                <Fragment key={associate.id}>
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleRow(associate.id)}
                        title={
                          expandedRows[associate.id]
                            ? "Ocultar detalles"
                            : "Mostrar detalles"
                        }
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
                    <TableCell>{associate.locationState.name}</TableCell>
                    <TableCell>
                      <Switch
                        checked={associate.isActive}
                        onCheckedChange={() => handleToggleStatus(associate.id)}
                        disabled={loadingStatus[associate.id] || (!associate.isActive && associate.isDeleted)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => onManageCertificates(associate.id)}
                          title="Gestionar certificados"
                        >
                          <ClipboardDocumentCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => onManageSpecialties(associate.id)}
                          title="Gestionar especialidades"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => onEdit(associate)}
                          title="Editar asociado"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700"
                              disabled={loadingDelete[associate.id]}
                            >
                              {loadingDelete[associate.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará al asociado {associate.companyName} y no
                                se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-gray-200 hover:bg-gray-100 hover:text-gray-900">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(associate.id)}
                                className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
                                disabled={loadingDelete[associate.id]}
                              >
                                {loadingDelete[associate.id] ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRows[associate.id] && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="p-4">
                          <h4 className="font-semibold mb-2">Información adicional</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Dirección</p>
                              <p>
                                {associate.street} {associate.externalNumber}
                                {associate.internalNumber
                                  ? ` Int. ${associate.internalNumber}`
                                  : ""}
                              </p>
                              <p>
                                {associate.neighborhood}, {associate.municipality}
                              </p>
                              <p>
                                {associate.locationState.name}, CP{" "}
                                {associate.postalCode}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Contacto</p>
                              <p>Tel: {associate.phone}</p>
                              {associate.mobile && <p>Cel: {associate.mobile}</p>}
                              <p>Email: {associate.email}</p>
                            </div>
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
