"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, FileText, Award, Trash2, Users } from "lucide-react";
import type { Company } from "@/types";
import { useRouter } from "next/navigation";

interface CompanyTableProps {
  data: Company[];
  loading?: boolean;
  onEdit: (item: Company) => void;
  onDelete: (item: Company) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
  onManageCertificates: (item: Company) => void;
  onManageSpecialties: (item: Company) => void;
  onManageStaff: (item: Company) => void;
}

export function CompanyTable({
  data,
  loading = false,
  onEdit,
  onDelete,
  onToggleStatus,
  onManageCertificates,
  onManageSpecialties,
  onManageStaff,
}: CompanyTableProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="w-full h-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Ciudad</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No hay empresas registradas
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.companyName}</TableCell>
                <TableCell>{item.contactName}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{item.phone}</TableCell>
                <TableCell>{item.city}</TableCell>
                <TableCell>
                  <Switch
                    checked={item.isActive}
                    onCheckedChange={() => onToggleStatus(item.id, item.isActive)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(item)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onManageCertificates(item)}
                      title="Certificados"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onManageSpecialties(item)}
                      title="Especialidades"
                    >
                      <Award className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onManageStaff(item)}
                      title="Personal"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
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
