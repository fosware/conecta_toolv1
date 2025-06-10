"use client";

import { useState, useEffect, useCallback } from "react";
import { type Company } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CompanyTable } from "./components/company-table";
import { CompanyModal } from "./components/company-modal";
import { CertificatesModal } from "./components/certificates-modal";
import { SpecialtiesModal } from "./components/specialties-modal";
import { UsersModal } from "./components/users-modal";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { useUserRole } from "@/hooks/use-user-role";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
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
import { CompanyOverview } from "./components/company-overview";
import { Pagination } from "@/components/ui/pagination";

export default function CompanyPage() {
  const {
    role,
    loading: roleLoading,
    isStaff,
    isAsociado,
    hasCompany,
    refresh: refreshUserRole,
  } = useUserRole();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActive, setShowActive] = useState(true);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
    comercialName: string | null;
  }>({
    isOpen: false,
    companyId: null,
    companyName: null,
    comercialName: null,
  });
  const [specialtiesModal, setSpecialtiesModal] = useState<{
    isOpen: boolean;
    companyId: number | null;
    companyName: string | null;
    comercialName: string | null;
  }>({
    isOpen: false,
    companyId: null,
    companyName: null,
    comercialName: null,
  });

  const [usersModal, setUsersModal] = useState<{
    isOpen: boolean;
    companyId: number | null;
    companyName: string | null;
    comercialName: string | null;
  }>({
    isOpen: false,
    companyId: null,
    companyName: null,
    comercialName: null,
  });

  const [selectedCompanyProfile, setSelectedCompanyProfile] =
    useState<any>(null);
  const [expandedCompanyId, setExpandedCompanyId] = useState<number | null>(
    null
  );

  const debouncedSearch = useDebounce(searchQuery, 300);

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      params.append("showActive", showActive.toString());
      params.append("page", currentPage.toString());
      params.append("limit", itemsPerPage.toString());

      const response = await fetch(`/api/companies?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar las empresas");
      }

      const data = await response.json();
      setCompanies(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (error) {
      console.error("Error loading companies:", error);
      toast.error("Error al cargar las empresas");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, showActive, currentPage, itemsPerPage]);

  const loadCompanyProfile = useCallback(async (companyId: number) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/profile`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar el perfil de la empresa");
      }

      const data = await response.json();
      setSelectedCompanyProfile(data);
    } catch (error) {
      console.error("Error loading company profile:", error);
      toast.error("Error al cargar el perfil de la empresa");
    }
  }, []);

  const handleRowClick = useCallback(
    (company: Company) => {
      if (expandedCompanyId === company.id) {
        setExpandedCompanyId(null);
        setSelectedCompanyProfile(null);
      } else {
        setExpandedCompanyId(company.id);
        loadCompanyProfile(company.id);
      }
    },
    [expandedCompanyId, loadCompanyProfile]
  );

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleDelete = async (item: Company) => {
    // Implementar lógica de eliminación
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/companies/${id}/toggle-status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cambiar el estado de la empresa");
      }

      await loadCompanies();
      toast.success("Estado de la empresa actualizado correctamente");
    } catch (error) {
      console.error("Error toggling company status:", error);
      toast.error("Error al cambiar el estado de la empresa");
    }
  };

  const handleManageCertificates = (item: Company) => {
    setCertificatesModal({
      isOpen: true,
      companyId: item.id,
      companyName: item.companyName,
      comercialName: item.comercialName || null,
    });
  };

  const handleManageSpecialties = (item: Company) => {
    setSpecialtiesModal({
      isOpen: true,
      companyId: item.id,
      companyName: item.companyName,
      comercialName: item.comercialName || null,
    });
  };

  const handleManageUsers = (item: Company) => {
    setUsersModal({
      isOpen: true,
      companyId: item.id,
      companyName: item.companyName,
      comercialName: item.comercialName || null,
    });
  };

  const handleEdit = async (item: Company) => {
    try {
      // Cargar los datos completos de la empresa
      const response = await fetch(`/api/companies/${item.id}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los datos de la empresa");
      }

      const responseData = await response.json();
      const companyData = responseData.data;

      // Abrir el modal con los datos completos
      setEditModal({ isOpen: true, item: companyData });
    } catch (error) {
      console.error("Error loading company data:", error);
      toast.error("Error al cargar los datos de la empresa");
      // Si hay un error, abrir el modal con los datos básicos que ya tenemos
      setEditModal({ isOpen: true, item });
    }
  };

  const handleSuccess = async () => {
    await refreshUserRole();
    await loadCompanies();
    // Si hay una empresa expandida, recargar su perfil
    if (expandedCompanyId) {
      await loadCompanyProfile(expandedCompanyId);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Asociados</h1>
          {!isStaff && !roleLoading && (isAsociado ? !hasCompany : true) && (
            <Button onClick={() => setEditModal({ isOpen: true, item: null })}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Asociado
            </Button>
          )}
        </div>
        {!isStaff && !isAsociado && !roleLoading && (
          <>
            <div className="flex flex-wrap items-center justify-between mb-4">
              <div>
                <CardTitle>Asociados</CardTitle>
                <CardDescription></CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-active"
                    checked={showActive}
                    onCheckedChange={setShowActive}
                  />
                  <Label htmlFor="show-active">Mostrar activos</Label>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="relative flex-grow flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Buscar asociados..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Resetear a la primera página al buscar
                  }}
                />
              </div>
              <div className="flex items-center space-x-2">
                <label htmlFor="itemsPerPage" className="mr-2">
                  Mostrar:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1); // Resetear a la primera página cuando cambia el tamaño
                  }}
                  className="border rounded-md p-1"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                </select>
              </div>
            </div>
          </>
        )}

        <CompanyTable
          data={companies}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          onManageCertificates={handleManageCertificates}
          onManageSpecialties={handleManageSpecialties}
          onManageUsers={handleManageUsers}
          onRowClick={handleRowClick}
          isStaff={isStaff}
          isAsociado={isAsociado}
          expandedId={expandedCompanyId}
          selectedCompanyProfile={selectedCompanyProfile}
        />
        
        {/* Componente de paginación */}
        {!loading && companies.length > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        <CompanyModal
          open={editModal.isOpen}
          onOpenChange={(open) =>
            setEditModal({ isOpen: open, item: editModal.item })
          }
          item={editModal.item}
          onSuccess={handleSuccess}
        />
        {certificatesModal.companyId && (
          <CertificatesModal
            open={certificatesModal.isOpen}
            onClose={() => {
              setCertificatesModal({
                isOpen: false,
                companyId: null,
                companyName: null,
                comercialName: null,
              });
            }}
            onSuccess={() => {
              // Si hay una empresa expandida y es la misma que se está editando, recargar su perfil
              if (expandedCompanyId && expandedCompanyId === certificatesModal.companyId) {
                loadCompanyProfile(expandedCompanyId);
              }
            }}
            companyId={certificatesModal.companyId}
            companyName={certificatesModal.companyName || ""}
            comercialName={certificatesModal.comercialName || ""}
          />
        )}
        {specialtiesModal.companyId && (
          <SpecialtiesModal
            open={specialtiesModal.isOpen}
            onClose={() => {
              setSpecialtiesModal({
                isOpen: false,
                companyId: null,
                companyName: null,
                comercialName: null,
              });
            }}
            onSuccess={() => {
              // Si hay una empresa expandida y es la misma que se está editando, recargar su perfil
              if (expandedCompanyId && expandedCompanyId === specialtiesModal.companyId) {
                loadCompanyProfile(expandedCompanyId);
              }
            }}
            companyId={specialtiesModal.companyId}
            companyName={specialtiesModal.companyName || ""}
            comercialName={specialtiesModal.comercialName || ""}
          />
        )}
        {usersModal.companyId && (
          <UsersModal
            open={usersModal.isOpen}
            onClose={() =>
              setUsersModal({
                isOpen: false,
                companyId: null,
                companyName: null,
                comercialName: null,
              })
            }
            companyId={usersModal.companyId}
            companyName={usersModal.companyName || ""}
            comercialName={usersModal.comercialName || ""}
          />
        )}
      </div>
    </div>
  );
}
