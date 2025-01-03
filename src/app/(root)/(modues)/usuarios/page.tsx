"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";
import { Usuario } from "@/lib/api/interfaces/usuario";
import { showToast } from "@/lib/toast";
import Image from "next/image";

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await fetch("/usuarios/api");
        if (res.ok) {
          const data: Usuario[] = await res.json();
          setUsuarios(data);
        } else {
          toast.error("Error al obtener usuarios.");
        }
      } catch (error) {
        toast.error("Error al conectar con la API.");
        console.error(error);
      }
    };

    fetchUsuarios();
  }, []);

  const filteredUsuarios = usuarios.filter(
    (usuario) =>
      (!onlyActive || usuario.isActive) &&
      (usuario.profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.role.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <Button onClick={() => showToast.info("Agregar usuario")}>
          Agregar Usuario
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <Input
          type="text"
          placeholder="Buscar por nombre, correo o rol"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <div className="flex items-center space-x-2">
          <label>Mostrar solo activos</label>
          <Switch checked={onlyActive} onCheckedChange={setOnlyActive} />
        </div>
      </div>

      <Table>
        <TableHeader className="">
          <TableRow className="">
            <TableHead>Nombre</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsuarios.map((usuario) => (
            <TableRow key={usuario.id}>
              <TableCell>{`${usuario.profile.name} ${usuario.profile.first_lastname}`}</TableCell>
              <TableCell>{usuario.email}</TableCell>
              <TableCell>{usuario.username}</TableCell>
              <TableCell>{usuario.role.name}</TableCell>
              <TableCell>
                <Switch checked={usuario.isActive} disabled />
              </TableCell>
              <TableCell className="flex gap-3">
                <Button className="bg-transparent p-2">
                  <Image
                    alt="delete icon"
                    src="/icons/edit.svg"
                    width={20}
                    height={20}
                    className="dark:invert dark:backdrop-brightness-1 tooltip-light"
                  />
                </Button>
                <Button className="bg-transparent p-2">
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsuariosPage;
