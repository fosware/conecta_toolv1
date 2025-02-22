"use client";

import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import React, { useCallback, useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import ClientTable from "./components/client-table";
import ClientModal from "./components/client-modal";
import { type Client, type ClientCreate } from "@/lib/schemas/client";
import { useDebounce } from "@/hooks/use-debounce";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";
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
import { Pagination } from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { AreasModal } from "./components/areas-modal";

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [showActive, setShowActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debouncedSearch = useDebounce(search);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  const [clientModal, setClientModal] = useState<{
    isOpen: boolean;
    client: Client | undefined;
  }>({
    isOpen: false,
    client: undefined,
  });

  const [areasModal, setAreasModal] = useState<{
    isOpen: boolean;
    client: Client | undefined;
  }>({
    isOpen: false,
    client: undefined,
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    client: Client | null;
  }>({
    isOpen: false,
    client: null,
  });

  const loadClients = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        search: debouncedSearch,
        onlyActive: showActive.toString(),
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      const response = await fetch(`/api/clients?${params}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los clientes");
      }

      const data = await response.json();
      setClients(data.clients);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      toast.error("Error al cargar los clientes");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, showActive, currentPage, itemsPerPage]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleCreateClient = async (data: ClientCreate) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear el cliente");
      }

      toast.success("Cliente creado correctamente");
      loadClients();
      setClientModal({ isOpen: false, client: undefined });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear el cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClient = async (data: ClientCreate) => {
    if (!clientModal.client) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/clients/${clientModal.client.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar el cliente");
      }

      toast.success("Cliente actualizado correctamente");
      loadClients();
      setClientModal({ isOpen: false, client: undefined });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar el cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    // Actualización optimista
    setClients((prev) =>
      prev.map((client) =>
        client.id === id ? { ...client, isActive: !currentStatus } : client
      )
    );

    try {
      const response = await fetch(`/api/clients/${id}/toggle-status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el estado del cliente");
      }

      const data = await response.json();
      toast.success(data.message);
      loadClients(); // Recargar para asegurar sincronización
    } catch (error) {
      // Revertir cambio en caso de error
      setClients((prev) =>
        prev.map((client) =>
          client.id === id ? { ...client, isActive: currentStatus } : client
        )
      );
      toast.error("Error al actualizar el estado del cliente");
    }
  };

  const handleShowActiveChange = (checked: boolean) => {
    setShowActive(checked);
    setCurrentPage(1); // Resetear a primera página al cambiar filtro
  };

  const handleDelete = async () => {
    if (!deleteDialog.client) return;

    try {
      const response = await fetch(`/api/clients/${deleteDialog.client.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el cliente");
      }

      toast.success("Cliente eliminado correctamente");
      loadClients();
      setDeleteDialog({ isOpen: false, client: null });
    } catch (error) {
      toast.error("Error al eliminar el cliente");
      console.error(error);
    }
  };

  const handleManageAreas = (client: Client) => {
    setAreasModal({ isOpen: true, client });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Clientes</h1>
          <Button onClick={() => setClientModal({ isOpen: true, client: undefined })}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex flex-row gap-2 md:gap-4 flex-1">
            <div className="flex-1">
              <label
                htmlFor="search-client"
                className="text-sm font-medium mb-2 block"
              >
                Buscar cliente
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-client"
                  placeholder="Buscar cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 min-w-[300px]"
                />
              </div>
            </div>
          </div>
          <div className="flex items-end pb-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={showActive}
                onCheckedChange={handleShowActiveChange}
              />
              <Label>Mostrar solo activos</Label>
            </div>
          </div>
        </div>

        <div className="mt-2">
          <ClientTable
            clients={clients}
            isLoading={isLoading}
            onEdit={(client) => setClientModal({ isOpen: true, client })}
            onDelete={(client) => setDeleteDialog({ isOpen: true, client })}
            onToggleStatus={handleToggleStatus}
            onManageAreas={handleManageAreas}
          />
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        <ClientModal
          isOpen={clientModal.isOpen}
          onClose={() => setClientModal({ isOpen: false, client: undefined })}
          onSubmit={clientModal.client ? handleUpdateClient : handleCreateClient}
          initialData={clientModal.client}
          isSubmitting={isSubmitting}
        />

        <AreasModal
          isOpen={areasModal.isOpen}
          onClose={() => setAreasModal({ isOpen: false, client: undefined })}
          client={areasModal.client || undefined}
        />

        <AlertDialog
          open={deleteDialog.isOpen}
          onOpenChange={(isOpen) =>
            setDeleteDialog({ isOpen, client: isOpen ? deleteDialog.client : null })
          }
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará el cliente y no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ClientsPage;
