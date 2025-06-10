"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Search } from "lucide-react";
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
import ClientTable from "./components/client-table";
import ClientModal from "./components/client-modal";
import AreaForm from "./components/area-form"; // Corregido import
import { Pagination } from "@/components/ui/pagination";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";
import {
  type Client,
  type ClientArea,
  type ClientCreate,
} from "@/lib/schemas/client";
import { useDebounce } from "@/hooks/use-debounce";

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [showActive, setShowActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debouncedSearch = useDebounce(search);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [clientModal, setClientModal] = useState<{
    isOpen: boolean;
    client: Client | undefined;
  }>({
    isOpen: false,
    client: undefined,
  });

  const [areaForm, setAreaForm] = useState<{
    isOpen: boolean;
    client: Client | undefined;
    area?: ClientArea;
  }>({
    isOpen: false,
    client: undefined,
  });

  const [deleteAreaDialog, setDeleteAreaDialog] = useState<{
    isOpen: boolean;
    area: ClientArea | null;
    client: Client | null;
  }>({
    isOpen: false,
    area: null,
    client: null,
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    client: Client | null;
  }>({
    isOpen: false,
    client: null,
  });

  const [expandedClientId, setExpandedClientId] = useState<number | null>(null);
  const [clientAreas, setClientAreas] = useState<ClientArea[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);

  const loadClients = useCallback(async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setIsLoading(true);
      }
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
      setTotalItems(data.total);
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

  // Efecto para limpiar las áreas cuando cambia de página
  useEffect(() => {
    // Cuando cambia la página, limpiamos el cliente expandido y sus áreas
    setExpandedClientId(null);
    setClientAreas([]);
  }, [currentPage]);

  // Efecto para limpiar las áreas cuando cambian los filtros o la búsqueda
  useEffect(() => {
    // Cuando cambian los filtros o la búsqueda, limpiamos el cliente expandido y sus áreas
    setExpandedClientId(null);
    setClientAreas([]);
  }, [debouncedSearch, showActive]);

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
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el cliente");
      }

      toast.success("Cliente creado exitosamente");
      setClientModal({ isOpen: false, client: undefined });
      loadClients(false); // No mostrar indicador de carga
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al crear el cliente"
      );
      console.error(error);
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
      setClientModal({ isOpen: false, client: undefined });
      loadClients(false); // No mostrar indicador de carga
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al actualizar el cliente"
      );
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
      loadClients(false); // Recargar sin mostrar indicador de carga
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
      setDeleteDialog({ isOpen: false, client: null });
      loadClients(false); // Recargar sin mostrar indicador de carga
    } catch (error) {
      toast.error("Error al eliminar el cliente");
      console.error(error);
    }
  };

  const handleManageAreas = (client: Client) => {
    // Ahora abrimos directamente el formulario para crear una nueva área
    setAreaForm({ isOpen: true, client, area: undefined });
  };

  const handleAreasUpdated = (clientId: number, areas: ClientArea[]) => {
    // Si el cliente actualizado es el mismo que está expandido, actualizamos las áreas
    if (expandedClientId === clientId) {
      setClientAreas(areas);
    }
  };

  const handleEditArea = (area: ClientArea) => {
    // Abrimos directamente el formulario de área con el área seleccionada para editar
    if (expandedClientId) {
      const client = clients.find((c) => c.id === expandedClientId);
      if (client) {
        setAreaForm({ isOpen: true, client, area });
      }
    }
  };

  const handleDeleteArea = async (area: ClientArea) => {
    if (!area || !expandedClientId) return;

    try {
      const response = await fetch(
        `/api/clients/${expandedClientId}/areas/${area.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el área");
      }

      toast.success("Área eliminada correctamente");

      // Actualizamos las áreas en la vista
      setClientAreas((prev) => prev.filter((a) => a.id !== area.id));

      // Cerramos el diálogo
      setDeleteAreaDialog({ isOpen: false, area: null, client: null });
    } catch (error) {
      console.error("Error al eliminar el área:", error);
      toast.error("Error al eliminar el área");
    }
  };

  const loadClientAreas = async (clientId: number) => {
    try {
      setLoadingAreas(true);
      const response = await fetch(`/api/clients/${clientId}/areas`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar las áreas");
      }

      const data = await response.json();
      setClientAreas(data);
    } catch (error) {
      console.error("Error al cargar las áreas:", error);
      toast.error("Error al cargar las áreas del cliente");
      setClientAreas([]);
    } finally {
      setLoadingAreas(false);
    }
  };

  const handleRowClick = (client: Client) => {
    if (expandedClientId === client.id) {
      // Si ya está expandido, lo colapsamos
      setExpandedClientId(null);
      setClientAreas([]);
    } else {
      // Si no está expandido, lo expandimos y cargamos sus áreas
      setExpandedClientId(client.id);
      loadClientAreas(client.id);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Clientes</h1>
          <Button
            onClick={() => setClientModal({ isOpen: true, client: undefined })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Clientes</h2>
            <p className="text-sm text-gray-500">{totalItems} clientes encontrados</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-active"
                checked={showActive}
                onCheckedChange={handleShowActiveChange}
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
              placeholder="Buscar clientes..."
              className="pl-8"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
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

        <div className="mt-2">
          <ClientTable
            clients={clients}
            isLoading={isLoading}
            onEdit={(client: Client) =>
              setClientModal({ isOpen: true, client })
            }
            onDelete={(client: Client) =>
              setDeleteDialog({ isOpen: true, client })
            }
            onToggleStatus={handleToggleStatus}
            onManageAreas={handleManageAreas}
            onRowClick={handleRowClick}
            expandedId={expandedClientId}
            clientAreas={clientAreas}
            loadingAreas={loadingAreas}
            onEditArea={handleEditArea}
            onDeleteArea={(area: ClientArea) => {
              const client =
                clients.find((c) => c.id === expandedClientId) || null;
              setDeleteAreaDialog({ isOpen: true, area, client });
            }}
          />
        </div>

        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

        <ClientModal
          isOpen={clientModal.isOpen}
          onClose={() => setClientModal({ isOpen: false, client: undefined })}
          onSubmit={
            clientModal.client ? handleUpdateClient : handleCreateClient
          }
          initialData={clientModal.client}
          isSubmitting={isSubmitting}
        />

        <AreaForm
          isOpen={areaForm.isOpen}
          onClose={() =>
            setAreaForm({ isOpen: false, client: undefined, area: undefined })
          }
          onSubmit={async (data) => {
            if (!areaForm.client) return;

            try {
              if (areaForm.area) {
                // Actualizar área existente
                const response = await fetch(
                  `/api/clients/${areaForm.client.id}/areas/${areaForm.area.id}`,
                  {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify(data),
                  }
                );

                if (!response.ok) {
                  throw new Error("Error al actualizar el área");
                }

                toast.success("Área actualizada correctamente");
              } else {
                // Crear nueva área
                const response = await fetch(
                  `/api/clients/${areaForm.client.id}/areas`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify({
                      ...data,
                      clientId: areaForm.client.id,
                    }),
                  }
                );

                if (!response.ok) {
                  throw new Error("Error al crear el área");
                }

                toast.success("Área creada correctamente");
              }

              // Recargar áreas si el cliente está expandido
              if (expandedClientId === areaForm.client.id) {
                await loadClientAreas(areaForm.client.id);
              }
            } catch (error) {
              console.error("Error:", error);
              toast.error("Error al guardar el área");
              throw error;
            }
          }}
          initialData={areaForm.area}
        />

        <AlertDialog
          open={deleteDialog.isOpen}
          onOpenChange={(isOpen) =>
            setDeleteDialog({
              isOpen,
              client: isOpen ? deleteDialog.client : null,
            })
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

        <AlertDialog
          open={deleteAreaDialog.isOpen}
          onOpenChange={(isOpen) =>
            setDeleteAreaDialog({
              isOpen,
              area: isOpen ? deleteAreaDialog.area : null,
              client: isOpen ? deleteAreaDialog.client : null,
            })
          }
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará el área "{deleteAreaDialog.area?.areaName}
                " y no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteArea(deleteAreaDialog.area!)}
              >
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
