"use client";

import { useState, useEffect, useCallback } from "react";
import { type Company } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CompanyTable } from "./components/company-table";
import { CompanyModal } from "./components/company-modal";
import { CertificatesModal } from "./components/certificates-modal";
import { SpecialtiesModal } from "./components/specialties-modal";
import { Plus, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { useDebounce } from "@/hooks/use-debounce";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CompanyPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActive, setShowActive] = useState(true);
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    item: Company | null;
  }>({
    isOpen: false,
    item: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    item: Company | null;
  }>({
    isOpen: false,
    item: null,
  });
  const [certificatesModal, setCertificatesModal] = useState<{
    isOpen: boolean;
    companyId: number | null;
    companyName: string | null;
  }>({
    isOpen: false,
    companyId: null,
    companyName: null,
  });
  const [specialtiesModal, setSpecialtiesModal] = useState<{
    isOpen: boolean;
    companyId: number | null;
    companyName: string | null;
  }>({
    isOpen: false,
    companyId: null,
    companyName: null,
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: debouncedSearch,
        showActive: showActive.toString(),
      });

      const response = await fetch(`/api/companies?${params}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los asociados");
      }

      const { items } = await response.json();
      
      // Asegurar que los items tengan valores por defecto
      const companiesWithDefaults = items.map((company: Partial<Company>) => ({
        ...company,
        isActive: company.isActive ?? true,
        isDeleted: company.isDeleted ?? false,
        shifts: company.shifts ?? "",
        companyLogo: company.companyLogo ?? null,
      })) as Company[];

      setCompanies(companiesWithDefaults);
    } catch (error) {
      console.error("Error loading companies:", error);
      toast.error("Error al cargar los asociados");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, showActive]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleEdit = (item: Company) => {
    setEditModal({ isOpen: true, item });
  };

  const handleDelete = async (item: Company) => {
    setDeleteDialog({ isOpen: true, item });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.item) return;

    try {
      const response = await fetch(`/api/companies/${deleteDialog.item.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar la empresa");
      }

      toast.success("Empresa eliminada correctamente");
      loadCompanies();
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error("Error al eliminar la empresa");
    } finally {
      setDeleteDialog({ isOpen: false, item: null });
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/companies/${id}/toggle-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el estado");
      }

      // Actualizar el estado localmente
      setCompanies((prevCompanies) =>
        prevCompanies.map((company) =>
          company.id === id
            ? { ...company, isActive: !currentStatus }
            : company
        )
      );

      toast.success(
        `Asociado ${!currentStatus ? "habilitado" : "inhabilitado"} correctamente`
      );
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Error al actualizar el estado del asociado");
    }
  };

  const handleOpenCertificates = (company: Company) => {
    setCertificatesModal({
      isOpen: true,
      companyId: company.id,
      companyName: company.companyName,
    });
  };

  const handleCloseCertificates = () => {
    setCertificatesModal({
      isOpen: false,
      companyId: null,
      companyName: null,
    });
  };

  const handleOpenSpecialties = (company: Company) => {
    setSpecialtiesModal({
      isOpen: true,
      companyId: company.id,
      companyName: company.companyName,
    });
  };

  const handleCloseSpecialties = () => {
    setSpecialtiesModal({
      isOpen: false,
      companyId: null,
      companyName: null,
    });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Asociados</h1>
          <Button onClick={() => setEditModal({ isOpen: true, item: null })}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Asociado
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row gap-4 justify-between">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre, contacto o email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showActive}
                    onCheckedChange={setShowActive}
                  />
                  <span className="text-sm text-gray-500">
                    Mostrar solo activos
                  </span>
                </div>
              </div>

              <CompanyTable
                data={companies}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onManageCertificates={handleOpenCertificates}
                onManageSpecialties={handleOpenSpecialties}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <CompanyModal
        open={editModal.isOpen}
        onOpenChange={(open) => setEditModal({ isOpen: open, item: null })}
        item={editModal.item}
        onSuccess={() => {
          setEditModal({ isOpen: false, item: null });
          loadCompanies();
        }}
      />

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog 
        open={deleteDialog.isOpen} 
        onOpenChange={(isOpen) => 
          setDeleteDialog(prev => ({ ...prev, isOpen }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la empresa &quot;{deleteDialog.item?.companyName}&quot; permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {certificatesModal.companyId && (
        <CertificatesModal
          open={certificatesModal.isOpen}
          onClose={handleCloseCertificates}
          companyId={certificatesModal.companyId}
          companyName={certificatesModal.companyName || ""}
        />
      )}

      {specialtiesModal.companyId && (
        <SpecialtiesModal
          open={specialtiesModal.isOpen}
          onClose={handleCloseSpecialties}
          companyId={specialtiesModal.companyId}
          companyName={specialtiesModal.companyName || ""}
        />
      )}
    </div>
  );
}
