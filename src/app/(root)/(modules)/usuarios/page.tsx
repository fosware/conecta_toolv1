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
import { showToast } from "@/components/ui/custom-toast";
import { Usuario } from "@/lib/api/interfaces/usuario";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { UserModal } from "@/components/ui/user-modal";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { useCallback } from "react";
import { UserFormData } from "@/lib/schemas/user";
/*
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
*/
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
      const data = await res.json();

      if (res.ok) {
        setUsuarios(data.usuarios || []);
        setTotalPages(data.totalPages || 1);
        /*
        // Solo mostrar mensaje de "no hay usuarios" si es una búsqueda o filtro
        if (data.usuarios.length === 0 && (searchTerm || onlyActive)) {
          showToast({
            message: "No se encontraron usuarios con los filtros actuales",
            type: "warning"
          });
        }
        */
      } else {
        showToast({
          message: data.message || "Error al obtener los usuarios",
          type: "error",
        });
        setUsuarios([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching usuarios:", error);
      showToast({
        message: "Error al obtener los usuarios",
        type: "error",
      });
      setUsuarios([]);
      setTotalPages(1);
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
        showToast({
          message: "Usuario registrado correctamente",
          type: "success",
        });
        fetchUsuarios(); // Actualiza la lista tras el registro
      } else {
        showToast({
          message: "Error al registrar el usuario",
          type: "error",
        });
      }
    } catch (error) {
      showToast({
        message: "Error al conectar con el servidor",
        type: "error",
      });
      console.error(error);
    }
  };

  const handleEdit = async (data: UserFormData) => {
    try {
      if (!editingUser) {
        showToast({
          message: "Error: Usuario no válido",
          type: "error",
        });
        return;
      }

      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Manejar específicamente la imagen
          if (key === "image_profile" && value instanceof File) {
            formData.append(key, value, value.name);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const res = await fetch(`/usuarios/api/${editingUser.id}`, {
        method: "PATCH",
        body: formData,
      });

      const responseData = await res.json();

      if (!res.ok) {
        showToast({
          message: responseData.message || "Error al actualizar el usuario",
          type: "error",
        });
        return;
      }

      showToast({
        message: "Usuario actualizado correctamente",
        type: "success",
      });
      setModalOpen(false);
      fetchUsuarios();
    } catch (error) {
      showToast({
        message: "Error al conectar con el servidor",
        type: "error",
      });
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <Button
          className="bg-primary hover:bg-primary/90 text-white"
          onClick={() => {
            setEditingUser(null);
            setModalOpen(true);
          }}
        >
          <UserPlus className="h-6 w-6 mr-2" />
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
                        showToast({
                          message: `Usuario ${isActive ? "habilitado" : "inhabilitado"}`,
                          type: "success",
                        });
                        fetchUsuarios(); // Actualiza la lista tras el cambio de estado
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
                  title="Editar usuario"
                  onClick={() => {
                    setEditingUser(usuario);
                    setModalOpen(true);
                  }}
                  className="h-9 w-9 p-0"
                >
                  <Pencil className="h-6 w-6" />
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
                        showToast({
                          message: "Usuario eliminado correctamente",
                          type: "success",
                        });
                        fetchUsuarios(); // Actualiza la lista tras la eliminación
                      } else {
                        showToast({
                          message: "Error al eliminar el usuario",
                          type: "error",
                        });
                      }
                    } catch (error) {
                      showToast({
                        message: "Error al eliminar el usuario",
                        type: "error",
                      });
                      console.error("Error al eliminar el usuario:", error);
                    }
                  }}
                  trigger={
                    <Button variant="ghost" size="icon" title="Eliminar usuario" className="h-9 w-9 p-0">
                      <Trash2 className="h-6 w-6" />
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
