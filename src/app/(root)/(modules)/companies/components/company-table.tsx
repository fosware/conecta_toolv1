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
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Users, Award, Medal, Loader2, ChevronRight, ChevronDown, FileText } from "lucide-react";
import { Company } from "@prisma/client";
import { useState } from "react";
import * as React from "react";
import { CompanyOverview } from "./company-overview";

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
  onRowClick?: (item: Company) => void;
  isStaff: boolean;
  isAsociado: boolean;
  expandedId: number | null;
  selectedCompanyProfile?: any;
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
  onRowClick,
  isStaff,
  isAsociado,
  expandedId,
  selectedCompanyProfile,
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
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Estado</TableHead>
            {showActiveColumn && <TableHead>Activo</TableHead>}
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                No hay empresas para mostrar
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <React.Fragment key={item.id}>
                <TableRow>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRowClick?.(item)}
                      title={expandedId === item.id ? "Contraer detalles" : "Expandir detalles"}
                      className="hover:bg-muted flex items-center gap-1 h-8 px-2"
                    >
                      <FileText className="h-4 w-4" />
                      {expandedId === item.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>{item.comercialName}</TableCell>
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
                          onCheckedChange={() =>
                            onToggleStatus(item.id, item.isActive)
                          }
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
                    </div>
                  </TableCell>
                </TableRow>
                {expandedId === item.id && selectedCompanyProfile && (
                  <TableRow>
                    <TableCell colSpan={showActiveColumn ? 8 : 7} className="p-0 border-t-0">
                      <div className="px-4 pb-4">
                        <CompanyOverview data={selectedCompanyProfile} />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
