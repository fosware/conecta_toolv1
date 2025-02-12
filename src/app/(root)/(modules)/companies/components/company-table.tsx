"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Users, Award, Medal, Loader2 } from "lucide-react";
import { Company } from "@prisma/client";

interface CompanyTableProps {
  data: (Company & {
    locationState?: {
      id: number;
      name: string;
    } | null;
  })[];
  loading: boolean;
  onEdit: (item: Company) => void;
  onDelete?: (item: Company) => void;
  onToggleStatus?: (id: number, currentStatus: boolean) => void;
  onManageCertificates?: (item: Company) => void;
  onManageSpecialties?: (item: Company) => void;
  onManageUsers?: (item: Company) => void;
  isStaff: boolean;
  isAsociado: boolean;
}

export function CompanyTable({
  data,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  onManageCertificates,
  onManageSpecialties,
  onManageUsers,
  isStaff,
  isAsociado,
}: CompanyTableProps) {
  // Determinar si el usuario puede editar y eliminar
  const canEdit = !isStaff;
  const canDelete = !isStaff && !isAsociado;
  const showActiveColumn = !isStaff && !isAsociado;
  const showAdminActions = !isStaff && !isAsociado;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Estado</TableHead>
            {showActiveColumn && <TableHead>Activo</TableHead>}
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                No hay empresas para mostrar
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.companyName}</TableCell>
                <TableCell>{item.contactName}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{item.phone}</TableCell>
                <TableCell>
                  {item.locationState?.name || "No especificado"}
                </TableCell>
                {showActiveColumn && (
                  <TableCell>
                    {onToggleStatus && (
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={() => onToggleStatus(item.id, item.isActive)}
                      />
                    )}
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(item)}
                        title="Editar perfil"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {!isStaff && (
                      <>
                        {onManageCertificates && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onManageCertificates(item)}
                            title="Certificados"
                          >
                            <Award className="h-4 w-4" />
                          </Button>
                        )}
                        {onManageSpecialties && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onManageSpecialties(item)}
                            title="Especialidades"
                          >
                            <Medal className="h-4 w-4" />
                          </Button>
                        )}
                        {onManageUsers && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onManageUsers(item)}
                            title="Usuarios"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => onDelete(item)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
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
