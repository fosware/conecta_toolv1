"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useUserRole } from "@/hooks/use-user-role";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getToken } from "@/lib/auth";
import { ClientCompanyNDATable } from "@/app/(root)/(modules)/client_company_nda/components/client-company-nda-table";
import { ClientCompanyNDAForm } from "@/app/(root)/(modules)/client_company_nda/components/client-company-nda-form";
import { DeleteNDADialog } from "@/app/(root)/(modules)/client_company_nda/components/delete-nda-dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/use-debounce";
import { ClientCompanyNDAItem } from "../client_company_nda/types/client-company-nda-item";

const ClientCompanyNDA = () => {
  const { loading: roleLoading } = useUserRole();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [loadingPermission, setLoadingPermission] = useState(true);
  const [ndaItems, setNdaItems] = useState<ClientCompanyNDAItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyValid, setShowOnlyValid] = useState(true);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Estados para modales
  const [formModal, setFormModal] = useState({
    isOpen: false,
    editItem: null as ClientCompanyNDAItem | null,
  });

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    ndaItem: null as ClientCompanyNDAItem | null,
  });

  // Verificar si el usuario tiene el privilegio específico
  useEffect(() => {
    const checkPermission = async () => {
      try {
        setLoadingPermission(true);
        const token = getToken();
        if (!token) {
          setHasPermission(false);
          router.push("/");
          return;
        }

        // Obtener los elementos del menú para verificar permisos
        const response = await fetch("/api/menu", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setHasPermission(false);
          router.push("/");
          return;
        }

        const menuItems = await response.json();

        // Verificar si el usuario tiene el privilegio "Administración de NDA's"
        const hasNDAPermission = menuItems.some(
          (item: any) => item.name === "Administración de NDA's"
        );

        setHasPermission(hasNDAPermission);

        // Si no tiene permiso, redirigir a la página principal
        if (!hasNDAPermission) {
          router.push("/");
        }
      } catch (error) {
        console.error("Error al verificar permisos:", error);
        setHasPermission(false);
        router.push("/");
      } finally {
        setLoadingPermission(false);
      }
    };

    if (!roleLoading) {
      checkPermission();
    }
  }, [roleLoading, router]);

  // Cargar datos de NDAs
  const loadNDAs = useCallback(async () => {
    try {
      setIsLoading(true);

      // Construir URL con parámetros de búsqueda si es necesario
      const params = new URLSearchParams();
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }
      params.append("showOnlyValid", showOnlyValid.toString());

      const url = `/api/client_company_nda?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los NDAs");
      }

      const data = await response.json();
      setNdaItems(data.data);
    } catch (error) {
      console.error("Error loading NDAs:", error);
      toast.error("Error al cargar los NDAs");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, showOnlyValid]);

  // Cargar datos una vez que se verifique que tiene permisos
  useEffect(() => {
    if (hasPermission && !loadingPermission) {
      loadNDAs();
    }
  }, [hasPermission, loadingPermission, loadNDAs]);

  // Manejadores para acciones
  const handleCreateNDA = () => {
    setFormModal({
      isOpen: true,
      editItem: null,
    });
  };

  const handleEditNDA = (item: ClientCompanyNDAItem) => {
    setFormModal({
      isOpen: true,
      editItem: item,
    });
  };

  const handleDeleteNDA = (item: ClientCompanyNDAItem) => {
    setDeleteDialog({
      isOpen: true,
      ndaItem: item,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Mostrar loader mientras se verifica permisos o se cargan datos
  if (roleLoading || loadingPermission) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si no tiene permiso, no renderizar nada (ya se redirigió)
  if (!hasPermission) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Administración de NDA's
        </h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleCreateNDA}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo NDA
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label
            htmlFor="search-nda"
            className="text-sm font-medium mb-2 block"
          >
            Buscar NDA
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-nda"
              type="search"
              placeholder="Buscar por cliente o asociado..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        <div className="flex flex-col justify-end">
          <div className="h-[40px] flex items-center">
            <div className="flex items-center space-x-2">
              <Switch
                checked={showOnlyValid}
                onCheckedChange={setShowOnlyValid}
                id="valid-filter"
              />
              <Label htmlFor="valid-filter" className="text-sm">
                Mostrar solo vigentes
              </Label>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ClientCompanyNDATable
              ndaItems={ndaItems}
              onEdit={handleEditNDA}
              onDelete={handleDeleteNDA}
              onRefresh={loadNDAs}
            />
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      <ClientCompanyNDAForm
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, editItem: null })}
        onSuccess={loadNDAs}
        editItem={formModal.editItem}
      />

      <DeleteNDADialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, ndaItem: null })}
        onSuccess={loadNDAs}
        ndaItem={deleteDialog.ndaItem}
      />
    </div>
  );
};

export default ClientCompanyNDA;
