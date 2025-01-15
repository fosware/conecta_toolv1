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
import CatCertificacionesModal from "@/components/ui/cat-certificaciones-modal";
import toast from "react-hot-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const CatalogCertifications = () => {
  const [certificaciones, setCertificaciones] = useState<Certificacion[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [onlyActive, setOnlyActive] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);

  //const [editingCertification, setEditingCertification] =
  //useState<Certificacion | null>(null);

  // Función para obtener certificaciones
  const fetchCertificaciones = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        onlyActive: onlyActive.toString(),
      });

      const res = await fetch(`/cat_certificaciones/api?${params}`);

      if (res.ok) {
        const data: { certificaciones: Certificacion[]; total: number } =
          await res.json();
        setCertificaciones(data.certificaciones);
        setTotalPages(Math.ceil(data.total / itemsPerPage));
      } else {
        toast.error("Error al obtener las certificaciones");
      }
    } catch (error) {
      toast.error("Error al obtener las certificaciones");
      console.error("Error al obtener las certificaciones:", error);
    }
  }, [currentPage, itemsPerPage, searchTerm, onlyActive]);

  useEffect(() => {
    fetchCertificaciones();
  }, [fetchCertificaciones]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Catálogo de Certificaciones</h1>
        <Button className="bg-transparent hover:text-white">
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
          <Switch checked={onlyActive} onCheckedChange={setOnlyActive} />
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
                    try {
                      const res = await fetch(
                        `/cat_certificaciones/api/${certificacion.id}/toggle-status`,
                        {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                        }
                      );
                      if (res.ok) {
                        toast.success(
                          `Certificación ${isActive ? "activada" : "desactivada"}.`
                        );
                        fetchCertificaciones();
                      } else {
                        toast.error("Error al actualizar el estado");
                      }
                    } catch (error) {
                      toast.error("Error al actualizar el estado");
                      console.error("Error al actualizar el estado:", error);
                    }
                  }}
                />
              </TableCell>
              <TableCell className="flex gap-3">
                <Button className="w-10 h-10 flex items-center justify-center bg-transparent p-0">
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
                        `/cat_certificaciones/api/${certificacion.id}`,
                        {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                          },
                        }
                      );
                      if (res.ok) {
                        toast.success("Certificación eliminada correctamente");
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
          ))}
        </TableBody>
      </Table>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        range={3} // Mostrar 3 páginas a la vez
      />
      {/* Modal */}
      <CatCertificacionesModal />
    </div>
  );
};

export default CatalogCertifications;
