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
import Image from "next/image";
import React from "react";
import toast from "react-hot-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { catCertificationsFormData } from "@/lib/schemas/cat_certifications";
import { CatCertificacionesModal } from "@/components/ui/cat-certificaciones-modal";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

const CatalogCertifications = () => {
  const { userId, isAuthenticated } = useCurrentUser();
  const [certificaciones, setCertificaciones] = useState<Certificacion[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [onlyActive, setOnlyActive] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingCertification, setEditingCertification] =
    useState<Certificacion | null>(null);

  // Función para obtener certificaciones
  const fetchCertificaciones = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        onlyActive: onlyActive.toString(),
      });

      const response = await fetch(`/cat_certificaciones/api?${params}`);
      const data = await response.json();

      if (data && Array.isArray(data)) {
        setCertificaciones(data);
        setTotalPages(Math.ceil(data.length / itemsPerPage));
      } else if (data && Array.isArray(data.certificaciones)) {
        setCertificaciones(data.certificaciones);
        setTotalPages(
          Math.ceil((data.total || data.certificaciones.length) / itemsPerPage)
        );
      } else {
        console.error("Unexpected data format:", data);
        setCertificaciones([]);
      }
    } catch (error) {
      console.error("Error fetching certificaciones:", error);
      toast.error("Error al obtener las certificaciones");
      setCertificaciones([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, onlyActive]);

  useEffect(() => {
    fetchCertificaciones();
  }, [fetchCertificaciones]);

  useEffect(() => {
    if (searchTerm !== "" || !onlyActive || currentPage > 1) {
      fetchCertificaciones();
    }
  }, [searchTerm, onlyActive, currentPage, fetchCertificaciones]);

  const handleRegister = async (data: catCertificationsFormData) => {
    if (!isAuthenticated || !userId) {
      toast.error("Debes iniciar sesión para realizar esta acción");
      setModalOpen(false);
      return;
    }

    try {
      const jsonData = {
        ...data,
        userId: userId.toString(),
      };

      const res = await fetch("/cat_certificaciones/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonData),
        credentials: "include",
      });

      if (!res.ok) {
        const responseData = await res
          .json()
          .catch(() => ({ message: "Error al crear la certificación" }));
        toast.error(responseData?.message || "Error al crear la certificación");
        return;
      }

      await res.json().catch(() => null);
      toast.success("Certificación creada correctamente");
      setModalOpen(false);
      fetchCertificaciones();
    } catch {
      toast.error("Error al crear la certificación");
    }
  };

  const handleUpdate = async (data: catCertificationsFormData) => {
    if (!isAuthenticated || !userId) {
      toast.error("Debes iniciar sesión para realizar esta acción");
      setModalOpen(false);
      return;
    }

    try {
      if (!editingCertification) {
        toast.error("Error: Certificación no válida");
        setModalOpen(false);
        return;
      }

      const jsonData = {
        ...data,
        userId: userId.toString(),
        id: editingCertification.id,
      };

      const res = await fetch(
        `/cat_certificaciones/api/${editingCertification.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(jsonData),
          credentials: "include",
        }
      );

      if (!res.ok) {
        const responseData = await res
          .json()
          .catch(() => ({ message: "Error al actualizar la certificación" }));
        toast.error(
          responseData?.message || "Error al actualizar la certificación"
        );
        return;
      }

      await res.json().catch(() => null);
      toast.success("Certificación actualizada correctamente");
      setModalOpen(false);
      setEditingCertification(null);
      fetchCertificaciones();
    } catch {
      toast.error("Error al actualizar la certificación");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Catálogo de Certificaciones</h1>
        <Button
          className="bg-transparent hover:text-white"
          onClick={() => {
            setEditingCertification(null);
            setModalOpen(true);
          }}
        >
          <Image
            src="/icons/new_user.svg"
            alt="new certification icon"
            width={24}
            height={24}
            className="dark:invert dark:backdrop-brightness-1 tooltip-light "
          />
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
              setIsLoading(true);
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : certificaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  No hay certificaciones disponibles
                </TableCell>
              </TableRow>
            ) : (
              certificaciones.map((certificacion) => (
                <TableRow key={certificacion.id}>
                  <TableCell>{certificacion.name}</TableCell>
                  <TableCell>{certificacion.description}</TableCell>
                  <TableCell>
                    <Switch
                      checked={certificacion.isActive}
                      onCheckedChange={async (isActive) => {
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
                            toast.success(
                              `Certificación ${isActive ? "habilitada" : "inhabilitada"}`
                            );
                            const updatedCertificaciones = certificaciones.map(
                              (cert) =>
                                cert.id === certificacion.id
                                  ? { ...cert, isActive }
                                  : cert
                            );
                            setCertificaciones(updatedCertificaciones);
                          } else {
                            toast.error("Error al actualizar el estado");
                          }
                        } catch (error) {
                          toast.error("Error al actualizar el estado");
                          console.error(
                            "Error al actualizar el estado:",
                            error
                          );
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="flex gap-3">
                    <Button
                      className="w-10 h-10 flex items-center justify-center bg-transparent p-0"
                      onClick={() => {
                        setEditingCertification(certificacion);
                        setModalOpen(true);
                      }}
                    >
                      <Image
                        alt="edit icon"
                        src="/icons/edit.svg"
                        width={20}
                        height={20}
                        className="dark:invert dark:backdrop-brightness-1"
                      />
                    </Button>
                    <ConfirmationDialog
                      question="¿Deseas eliminar la certificación?"
                      onConfirm={async () => {
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
                            toast.success(
                              "Certificación eliminada correctamente"
                            );
                            fetchCertificaciones();
                          } else {
                            toast.error("Error al eliminar la certificación");
                          }
                        } catch (error) {
                          toast.error("Error al eliminar la certificación");
                          console.error(
                            "Error al eliminar la certificación:",
                            error
                          );
                        }
                      }}
                      trigger={
                        <Button className="w-10 h-10 flex items-center justify-center bg-transparent p-0">
                          <Image
                            alt="delete icon"
                            src="/icons/delete.svg"
                            width={20}
                            height={20}
                            className="dark:invert dark:backdrop-brightness-1"
                          />
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
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
        onSubmit={editingCertification ? handleUpdate : handleRegister}
        initialData={editingCertification || undefined}
        mode={editingCertification ? "edit" : "create"}
      />
    </div>
  );
};

export default CatalogCertifications;
