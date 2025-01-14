"use client";

//import { useState, useEffect } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
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

const CatalogCertifications = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  //const [totalPages, setTotalPages] = useState<number>(1);
  //const [itemsPerPage, setItemsPerPage] = useState<number>(15);

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
          className="flex-grow flex-1 min-w-[200px]"
        />
        <div className="flex items-center space-x-2">
          <label>Mostrar solo activos</label>
          <Switch className="" />
        </div>
        <div>
          <label htmlFor="itemsPerPage" className="mr-2">
            Mostrar:
          </label>
          <select className="border rounded-md p-1">
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
          <TableRow>
            <TableCell>ISO</TableCell>
            <TableCell>ISO despripción</TableCell>
            <TableCell>
              <Switch></Switch>{" "}
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
              <Button className="w-10 h-10 flex items-center justify-center bg-transparent p-0">
                <Image
                  alt="delete icon"
                  src="/icons/delete.svg"
                  width={20}
                  height={20}
                  className="dark:invert dark:backdrop-brightness-1"
                />
              </Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>ISO1</TableCell>
            <TableCell>ISO1 despripción</TableCell>
            <TableCell>
              <Switch></Switch>{" "}
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
              <Button className="w-10 h-10 flex items-center justify-center bg-transparent p-0">
                <Image
                  alt="delete icon"
                  src="/icons/delete.svg"
                  width={20}
                  height={20}
                  className="dark:invert dark:backdrop-brightness-1"
                />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Pagination
        currentPage={currentPage}
        totalPages={1 /* totalPages */}
        onPageChange={setCurrentPage}
        range={3} // Mostrar 3 páginas a la vez
      />
      {/* Modal */}
      <CatCertificacionesModal />
    </div>
  );
};

export default CatalogCertifications;
