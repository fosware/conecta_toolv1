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
import { Pagination } from "@/components/ui/pagination";
import { toast } from "react-hot-toast";
import { Usuario } from "@/lib/api/interfaces/usuario";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { UserModal } from "@/components/ui/user-modal";
import Image from "next/image";
import { useCallback } from "react";

interface UserFormData {
  id?: string;
  name: string;
  first_lastname: string;
  second_lastname?: string | null;
  email: string;
  username: string;
  password?: string | null;
  confirmPassword?: string | null;
  roleId: string;
  phone?: string | null;
  image_profile?: File | null;
}

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [onlyActive, setOnlyActive] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  // Función para obtener usuarios
  const fetchUsuarios = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        onlyActive: onlyActive.toString(),
      });

      const res = await fetch(`/usuarios/api?${params}`);
      if (res.ok) {
        const data: { usuarios: Usuario[]; totalPages: number } =
          await res.json();
        setUsuarios(data.usuarios);
        setTotalPages(data.totalPages);
      } else {
        toast.error("Error al obtener usuarios.");
      }
    } catch (error) {
      toast.error("Error al conectar con la API.");
      console.error(error);
    }
  }, [currentPage, itemsPerPage, searchTerm, onlyActive]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleRegister = async (data: UserFormData) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      const res = await fetch("/usuarios/api", {
        method: "POST",
        body: formData, // Enviar datos como FormData para incluir archivos
      });

      if (res.ok) {
        toast.success("Usuario registrado correctamente.");
        fetchUsuarios(); // Actualiza la lista tras el registro
      } else {
        toast.error("Error al registrar el usuario.");
      }
    } catch (error) {
      toast.error("Error al conectar con el servidor.");
      console.error(error);
    }
  };

  const handleEdit = async (data: UserFormData) => {
    if (!editingUser) return;

    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      const res = await fetch(`/usuarios/api/${editingUser.id}`, {
        method: "PATCH",
        body: formData, // Enviar datos como FormData para incluir archivos
      });

      if (res.ok) {
        toast.success("Usuario actualizado correctamente.");
        fetchUsuarios(); // Actualiza la lista tras la edición
      } else {
        toast.error("Error al actualizar el usuario.");
      }
    } catch (error) {
      toast.error("Error al conectar con el servidor.");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <Button
          className="bg-transparent hover:text-white"
          onClick={() => {
            setEditingUser(null);
            setModalOpen(true);
          }}
        >
          <Image
            src="/icons/new_user.svg"
            alt="new user icon"
            width={24}
            height={24}
            className="dark:invert dark:backdrop-brightness-1 tooltip-light"
          />
          Agregar Usuario
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Input
          type="text"
          placeholder="Buscar por nombre, correo o rol"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className=" flex-grow flex-1 min-w-[200px]"
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
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
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
            <TableHead>Correo</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.map((usuario) => (
            <TableRow key={usuario.id}>
              <TableCell>{`${usuario.profile?.name} ${usuario.profile?.first_lastname}`}</TableCell>
              <TableCell>{usuario.email}</TableCell>
              <TableCell>{usuario.username}</TableCell>
              <TableCell>{usuario.role.name}</TableCell>
              <TableCell>
                <Switch
                  checked={usuario.isActive}
                  onCheckedChange={async (isActive) => {
                    try {
                      const res = await fetch(
                        `/usuarios/api/${usuario.id}/toggle-status`,
                        {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                        }
                      );

                      if (res.ok) {
                        toast.success(
                          `Usuario ${isActive ? "habilitado" : "inhabilitado"}.`
                        );
                        fetchUsuarios(); // Actualiza la lista tras el cambio de estado
                      } else {
                        toast.error(
                          "No se pudo actualizar el estado del usuario."
                        );
                      }
                    } catch (error) {
                      toast.error("Error al conectar con el servidor.");
                      console.error(error);
                    }
                  }}
                />
              </TableCell>
              <TableCell className="flex gap-3">
                <Button
                  className="w-10 h-10 flex items-center justify-center bg-transparent p-0"
                  onClick={() => {
                    setEditingUser(usuario);
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
                  question={`¿Estás seguro de que quieres eliminar al usuario ${usuario.username}?`}
                  onConfirm={async () => {
                    try {
                      const res = await fetch(
                        `/usuarios/api/${usuario.id}/delete`,
                        {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                          },
                        }
                      );

                      if (res.ok) {
                        toast.success("Usuario eliminado correctamente.");
                        fetchUsuarios(); // Actualiza la lista tras la eliminación
                      } else {
                        toast.error("Error al eliminar usuario.");
                      }
                    } catch (error) {
                      toast.error("Error al conectar con el servidor.");
                      console.error(error);
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

      {/* Modal para registro/edición */}
      <UserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchUsuarios}
        onSubmit={editingUser ? handleEdit : handleRegister}
        initialData={
          editingUser
            ? {
                id: editingUser.id.toString(), // Asegúrate de que este `id` esté presente
                name: editingUser.profile?.name || "",
                first_lastname: editingUser.profile?.first_lastname || "",
                second_lastname: editingUser.profile?.second_lastname || null,
                email: editingUser.email,
                username: editingUser.username,
                roleId: String(editingUser.role.id),
                phone: editingUser.profile?.phone || null,
                image_profile: null,
              }
            : undefined
        }
        mode={editingUser ? "edit" : "create"}
      />
    </div>
  );
};

export default UsuariosPage;
