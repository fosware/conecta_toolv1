"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import { Certificacion } from "@/lib/api/interfaces/certificaciones";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, PlusCircle } from "lucide-react";
import React from "react";
import { showToast } from "@/components/ui/custom-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { catCertificationsFormData } from "@/lib/schemas/cat_certifications";
import { CatCertificacionesModal } from "@/components/ui/cat-certificaciones-modal";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useAuth } from "@/hooks/useAuth";

const CatalogCertifications = () => {
  const { userId } = useCurrentUser();
  const { isAuthenticated, isLoading } = useAuth();
  const [certificaciones, setCertificaciones] = useState<Certificacion[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [onlyActive, setOnlyActive] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);
  //const [isLoading, setIsLoading] = useState<boolean>(true);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingCertification, setEditingCertification] =
    useState<Certificacion | null>(null);

  // Función para obtener certificaciones
  const fetchCertificaciones = useCallback(async () => {
    if (!isAuthenticated || isLoading) return;

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        onlyActive: onlyActive.toString(),
      });

      const res = await fetch(`/cat_certificaciones/api?${params}`);
      const data = await res.json();

      if (res.ok) {
        setCertificaciones(data.certificaciones || []);
        setTotalPages(data.totalPages || 1);

        // Solo mostrar mensaje de "no hay certificaciones" si es una búsqueda o filtro
        /*
        if (data.certificaciones.length === 0 && (searchTerm || onlyActive)) {
          showToast({
            message: "No se encontraron certificaciones con los filtros actuales",
            type: "warning"
          });
        } */
      } else {
        showToast({
          message: data.message || "Error al obtener las certificaciones",
          type: "error",
        });
        setCertificaciones([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching certificaciones:", error);
      showToast({
        message: "Error al obtener las certificaciones",
        type: "error",
      });
      setCertificaciones([]);
      setTotalPages(1);
    }
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    onlyActive,
    isAuthenticated,
    isLoading,
  ]);
  //setIsLoading(false);
  useEffect(() => {
    fetchCertificaciones();
  }, [fetchCertificaciones]);

  const handleRegister = async (data: catCertificationsFormData) => {
    if (!isAuthenticated || isLoading) return;

    try {
      // Obtener el userId del token
      const token = document.cookie.replace(
        /(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/,
        "$1"
      );
      const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
      const userId = payload?.userId;

      if (!userId) {
        showToast({
          message: "Error: No se pudo obtener el ID del usuario",
          type: "error",
        });
        return;
      }

      const res = await fetch("/cat_certificaciones/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          userId: userId
        }),
      });

      if (res.ok) {
        showToast({
          message: "Certificación creada correctamente.",
          type: "success",
        });
        fetchCertificaciones(); // Actualiza la lista tras el registro
      } else {
        const errorData = await res.json();
        showToast({
          message: errorData.message || "Error al crear la certificación.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error al crear la certificación:", error);
      showToast({
        message: "Error al crear la certificación",
        type: "error",
      });
    }
  };

  const handleEdit = async (data: catCertificationsFormData) => {
    if (!isAuthenticated || isLoading) return;

    try {
      if (!editingCertification) {
        showToast({
          message: "Error: Certificación no válida",
          type: "error",
        });
        return;
      }

      const res = await fetch(
        `/cat_certificaciones/api/${editingCertification.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            userId: userId?.toString(),
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        showToast({
          message: errorData.message || "Error al actualizar la certificación",
          type: "error",
        });
        return;
      }

      setModalOpen(false);
      fetchCertificaciones();
    } catch (error) {
      console.error("Error al actualizar la certificación:", error);
      showToast({
        message: "Error al actualizar la certificación",
        type: "error",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Catálogo de Certificaciones</h1>
        <Button
          className="bg-primary hover:bg-primary/90 text-white"
          onClick={() => {
            setEditingCertification(null);
            setModalOpen(true);
          }}
        >
          <PlusCircle className="h-6 w-6 mr-2" />
          Agregar Certificación
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Input
          type="text"
          placeholder="Buscar por certificación"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow flex-1 min-w-[200px]"
        />
        <div className="flex items-center space-x-2">
          <label>Mostrar solo activos</label>
          <Switch
            checked={onlyActive}
            onCheckedChange={(checked) => {
              setOnlyActive(checked);
              setCurrentPage(1);
              //setIsLoading(true);
            }}
          />
        </div>
        <div>
          <label htmlFor="itemsPerPage" className="mr-2">
            Mostrar:
          </label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
            className="border rounded-md p-1"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certificaciones.map((certificacion) => (
              <TableRow key={certificacion.id}>
                <TableCell>{certificacion.name}</TableCell>
                <TableCell>{certificacion.description}</TableCell>
                <TableCell>
                  <Switch
                    checked={certificacion.isActive}
                    onCheckedChange={async (isActive) => {
                      if (!isAuthenticated || isLoading) return;

                      try {
                        const res = await fetch(
                          `/cat_certificaciones/api/${certificacion.id}/toggle-status`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                          }
                        );
                        if (res.ok) {
                          showToast({
                            message: `Certificación ${isActive ? "habilitada" : "inhabilitada"}`,
                            type: "success",
                          });
                          fetchCertificaciones();
                        } else {
                          showToast({
                            message: "Error al actualizar el estado",
                            type: "error",
                          });
                        }
                      } catch (error) {
                        showToast({
                          message: "Error al actualizar el estado",
                          type: "error",
                        });
                        console.error("Error al actualizar el estado:", error);
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Editar certificación"
                    onClick={() => {
                      console.log(
                        "Edit button clicked, certification:",
                        certificacion
                      );
                      setEditingCertification(certificacion);
                      setModalOpen(true);
                    }}
                    className="h-9 w-9 p-0"
                  >
                    <Pencil className="h-6 w-6" />
                  </Button>
                  <ConfirmationDialog
                    question="¿Deseas eliminar la certificación?"
                    onConfirm={async () => {
                      if (!isAuthenticated || isLoading) return;

                      try {
                        const res = await fetch(
                          `/cat_certificaciones/api/${certificacion.id}/delete`,
                          {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            credentials: "include",
                          }
                        );
                        if (res.ok) {
                          showToast({
                            message: "Certificación eliminada correctamente",
                            type: "success",
                          });
                          fetchCertificaciones();
                        } else {
                          showToast({
                            message: "Error al eliminar la certificación",
                            type: "error",
                          });
                        }
                      } catch (error) {
                        showToast({
                          message: "Error al eliminar la certificación",
                          type: "error",
                        });
                        console.error(
                          "Error al eliminar la certificación:",
                          error
                        );
                      }
                    }}
                    trigger={
                      <Button variant="ghost" size="icon" title="Eliminar certificación" className="h-9 w-9 p-0">
                        <Trash2 className="h-6 w-6" />
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        range={3} // Mostrar 3 páginas a la vez
      />
      <CatCertificacionesModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCertification(null);
        }}
        onSubmit={editingCertification ? handleEdit : handleRegister}
        initialData={
          editingCertification
            ? {
                name: editingCertification.name,
                description: editingCertification.description,
                isActive: editingCertification.isActive,
                isDeleted: editingCertification.isDeleted,
              }
            : undefined
        }
        mode={editingCertification ? "edit" : "create"}
        onSuccess={fetchCertificaciones}
      />
    </div>
  );
};

export default CatalogCertifications;
