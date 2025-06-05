"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface User {
  id: number;
  email: string;
  username: string;
  roleCompany: string;
  isActive: boolean;
  profile: {
    name: string;
    first_lastname: string;
    second_lastname?: string;
    phone?: string;
  };
}

type EditingUser = User | null;

interface UsersModalProps {
  open: boolean;
  onClose: () => void;
  companyId: number;
  companyName: string;
  comercialName?: string;
}

export function UsersModal({
  open,
  onClose,
  companyId,
  companyName,
  comercialName,
}: UsersModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({
    isOpen: false,
    user: null,
  });
  const [editingUser, setEditingUser] = useState<EditingUser>(null);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "",
    roleCompany: "",
    name: "",
    first_lastname: "",
    second_lastname: "",
    phone: "",
  });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/companies/${companyId}/users`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar usuarios");
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      toast.error("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open, loadUsers]);

  const resetForm = () => {
    setFormData({
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: "",
      roleCompany: "",
      name: "",
      first_lastname: "",
      second_lastname: "",
      phone: "",
    });
  };

  useEffect(() => {
    if (editingUser) {
      setFormData({
        email: editingUser.email,
        username: editingUser.username,
        password: "",
        confirmPassword: "",
        role: editingUser.roleCompany === "Asociado" ? "Admin" : "Staff",
        roleCompany: editingUser.roleCompany,
        name: editingUser.profile?.name || "",
        first_lastname: editingUser.profile?.first_lastname || "",
        second_lastname: editingUser.profile?.second_lastname || "",
        phone: editingUser.profile?.phone || "",
      });
    } else {
      resetForm();
    }
  }, [editingUser]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requiredFields = editingUser
        ? ["email", "username", "role", "roleCompany", "name", "first_lastname"]
        : [
            "email",
            "username",
            "password",
            "role",
            "roleCompany",
            "name",
            "first_lastname",
          ];

      const missingFields = requiredFields.filter(
        (field) => !formData[field as keyof typeof formData]
      );

      if (missingFields.length > 0) {
        toast.error(`Faltan campos requeridos: ${missingFields.join(", ")}`);
        return;
      }

      if (!editingUser || formData.password) {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Las contraseñas no coinciden");
          return;
        }
      }

      const url = editingUser
        ? `/api/companies/${companyId}/users/${editingUser.id}`
        : `/api/companies/${companyId}/users`;

      if (editingUser) {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === editingUser.id
              ? {
                  ...user,
                  email: formData.email,
                  username: formData.username,
                  roleCompany: formData.roleCompany,
                  profile: {
                    name: formData.name,
                    first_lastname: formData.first_lastname,
                    second_lastname: formData.second_lastname || undefined,
                    phone: formData.phone || undefined,
                  },
                }
              : user
          )
        );
      }

      const response = await fetch(url, {
        method: editingUser ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        if (editingUser) {
          await loadUsers();
        }
        const result = await response.json().catch(() => ({}));
        throw new Error(
          result.error || result.details || "Error al procesar la solicitud"
        );
      }

      if (!editingUser) {
        loadUsers();
      }

      toast.success(
        `Usuario ${editingUser ? "actualizado" : "creado"} exitosamente`
      );

      setEditingUser(null);
      resetForm();

      const firstInput = document.querySelector("input") as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al procesar la solicitud"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, isActive: !currentStatus } : user
      )
    );

    try {
      const response = await fetch(
        `/api/companies/${companyId}/users/${userId}/toggle-status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, isActive: currentStatus } : user
          )
        );
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Error al cambiar el estado del usuario");
      }

      toast.success("Estado actualizado exitosamente");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al cambiar el estado del usuario"
      );
    }
  };

  const handleDelete = async (user: User) => {
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    setDeleteDialog({ isOpen: false, user: null });

    try {
      const response = await fetch(
        `/api/companies/${companyId}/users/${user.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        await loadUsers();
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Error al eliminar el usuario");
      }

      toast.success("Usuario eliminado exitosamente");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar el usuario"
      );
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser({
      id: user.id,
      email: user.email,
      username: user.username,
      roleCompany: user.roleCompany,
      isActive: user.isActive,
      profile: {
        name: user.profile.name,
        first_lastname: user.profile.first_lastname,
        second_lastname: user.profile.second_lastname,
        phone: user.profile.phone,
      },
    });
  };

  const handleFormCancel = () => {
    setEditingUser(null);
  };

  useEffect(() => {
    if (!open) {
      setEditingUser(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingUser ? "Editar" : "Agregar"} Usuario de{" "}
            <span className="text-blue-500 dark:text-blue-400 font-bold">{comercialName || companyName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="border p-4 rounded-lg">
            <UserFormContent
              onSubmit={handleSubmit}
              onCancel={handleFormCancel}
              initialData={editingUser}
              formData={formData}
              handleInputChange={handleInputChange}
            />
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Puesto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Cargando usuarios...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No hay usuarios asignados
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        {user.profile.name} {user.profile.first_lastname}{" "}
                        {user.profile.second_lastname}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.roleCompany}</TableCell>
                      <TableCell>
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={() =>
                            handleToggleStatus(user.id, user.isActive)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setDeleteDialog({ isOpen: true, user })
                          }
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteDialog({ isOpen, user: isOpen ? deleteDialog.user : null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará al usuario &quot;
              {deleteDialog.user?.username}&quot; de la empresa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.user && handleDelete(deleteDialog.user)
              }
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

function UserFormContent({
  onSubmit,
  onCancel,
  initialData,
  formData,
  handleInputChange,
}: {
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  initialData: EditingUser;
  formData: {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    role: string;
    roleCompany: string;
    name: string;
    first_lastname: string;
    second_lastname: string;
    phone: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="first_lastname">Primer Apellido</Label>
          <Input
            id="first_lastname"
            name="first_lastname"
            value={formData.first_lastname}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="second_lastname">Segundo Apellido</Label>
          <Input
            id="second_lastname"
            name="second_lastname"
            value={formData.second_lastname}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Usuario</Label>
          <Input
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Seleccionar rol</option>
            <option value="Admin">Admin</option>
            <option value="Staff">Staff</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="roleCompany">Puesto en la empresa</Label>
          <Input
            id="roleCompany"
            name="roleCompany"
            value={formData.roleCompany}
            onChange={handleInputChange}
            placeholder="Ej: Gerente, Director, Analista..."
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
}
