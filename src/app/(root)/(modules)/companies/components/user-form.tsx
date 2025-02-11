"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserFormProps {
  companyId: number;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  initialData?: {
    email: string;
    username: string;
    roleCompany: string;
    profile: {
      name: string;
      first_lastname: string;
      second_lastname?: string;
      phone?: string;
    };
  } | null;
}

interface UserFormData {
  name: string;
  first_lastname: string;
  second_lastname?: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  roleCompany: string;
  role: string;
  phone?: string;
}

const APP_ROLES = [
  { value: "Asociado", label: "Asociado (Administrador)" },
  { value: "Staff", label: "Staff (Personal de Apoyo)" },
];

export function UserForm({
  companyId,
  onSubmit,
  onCancel,
  initialData,
}: UserFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState<Partial<UserFormData>>({
    name: initialData?.profile.name || "",
    first_lastname: initialData?.profile.first_lastname || "",
    second_lastname: initialData?.profile.second_lastname || "",
    email: initialData?.email || "",
    username: initialData?.username || "",
    password: "",
    confirmPassword: "",
    roleCompany: initialData?.roleCompany || "",
    role: "",
    phone: initialData?.profile.phone || "",
  });

  useEffect(() => {
    if (initialData) {
      setFormState({
        name: initialData.profile.name,
        first_lastname: initialData.profile.first_lastname,
        second_lastname: initialData.profile.second_lastname || "",
        email: initialData.email,
        username: initialData.username,
        password: "",
        confirmPassword: "",
        roleCompany: initialData.roleCompany,
        role: "",
        phone: initialData.profile.phone || "",
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await onSubmit(formData);
      if (!initialData) {
        clearForm();
      }
    } catch (error) {
      console.error("Error in form submission:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    clearForm();
    onCancel();
  };

  const clearForm = () => {
    if (formRef.current) {
      formRef.current.reset();
      setFormState({
        name: "",
        first_lastname: "",
        second_lastname: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
        roleCompany: "",
        role: "Staff",
        phone: "",
      });
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            placeholder="Nombre"
            defaultValue={formState.name}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="first_lastname">Apellido Paterno</Label>
          <Input
            id="first_lastname"
            name="first_lastname"
            placeholder="Apellido Paterno"
            defaultValue={formState.first_lastname}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="second_lastname">Apellido Materno</Label>
          <Input
            id="second_lastname"
            name="second_lastname"
            placeholder="Apellido Materno"
            defaultValue={formState.second_lastname}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            name="phone"
            placeholder="Teléfono"
            defaultValue={formState.phone}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="correo@ejemplo.com"
            defaultValue={formState.email}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Usuario</Label>
          <Input
            id="username"
            name="username"
            placeholder="Nombre de usuario"
            defaultValue={formState.username}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={initialData ? "Dejar en blanco para mantener" : "Contraseña"}
            required={!initialData}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder={initialData ? "Dejar en blanco para mantener" : "Confirmar Contraseña"}
            required={!initialData}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="roleCompany">Rol en la Empresa</Label>
          <Input
            id="roleCompany"
            name="roleCompany"
            placeholder="Rol en la empresa"
            defaultValue={formState.roleCompany}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Rol en la Aplicación</Label>
          <Select name="role" defaultValue={formState.role || "Staff"}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Asociado">Asociado</SelectItem>
              <SelectItem value="Staff">Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialData ? 'Actualizar' : 'Guardar'}
            </>
          ) : (
            initialData ? 'Actualizar' : 'Guardar'
          )}
        </Button>
      </div>
    </form>
  );
}
