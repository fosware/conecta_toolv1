import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, UserFormData } from "@/lib/schemas/user";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/custom-toast";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  initialData?: Partial<UserFormData>;
  mode: "edit" | "create";
  onSuccess?: () => Promise<void>;
}

export const UserModal = ({
  isOpen,
  onClose,
  // onSubmit,
  onSuccess,
  initialData,
  mode,
}: UserModalProps) => {
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData || {},
    mode: "onBlur",
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === "create") {
        // Limpia el formulario para un nuevo usuario
        reset({
          name: "",
          first_lastname: "",
          second_lastname: null,
          email: "",
          username: "",
          password: "",
          confirmPassword: "",
          roleId: "",
          phone: null,
          image_profile: null,
        });
        setProfileImage(null);
      } else if (mode === "edit" && initialData) {
        // Rellena los datos del usuario a editar
        reset({
          ...initialData,
          password: "",
          confirmPassword: "",
        });

        if (initialData?.image_profile === null) {
          // Carga dinámica de la imagen si no está precargada
          fetch(`/usuarios/api/${initialData.id}/profile-image`)
            .then((res) => {
              if (res.status === 404) {
                console.warn("El usuario no tiene imagen de perfil.");
                return null;
              }
              if (!res.ok) {
                throw new Error("No se pudo cargar la imagen");
              }
              return res.blob();
            })
            .then((blob) => {
              if (blob) {
                const imageUrl = URL.createObjectURL(blob);
                setProfileImage(imageUrl);
              } else {
                setProfileImage(null);
              }
            })
            .catch((error) => {
              console.error("Error al cargar la imagen del perfil:", error);
              setProfileImage(null);
            });
        } else if (typeof initialData.image_profile === "string") {
          setProfileImage(initialData.image_profile); // Imagen como URL directa
        } else {
          setProfileImage(null); // Limpia la imagen si no hay ninguna
        }
      }
    }
  }, [isOpen, mode, initialData, reset]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch("/api/roles");
        if (res.ok) {
          const data = await res.json();
          setRoles(data);
        } else {
          console.error("Error al cargar roles");
        }
      } catch (error) {
        console.error("Error al realizar fetch:", error);
      }
    };

    fetchRoles();
  }, []);

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
      setValue("image_profile", file);
    } else {
      setProfileImage(null);
      setValue("image_profile", null);
    }
  };

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      const endpoint =
        mode === "edit" && initialData?.id
          ? `/usuarios/api/${initialData.id}`
          : "/usuarios/api";

      const method = mode === "edit" ? "PATCH" : "POST";

      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "image_profile" && value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, value instanceof Date ? value.toISOString() : String(value));
          }
        }
      });

      const res = await fetch(endpoint, {
        method,
        body: formData,
      });

      const responseData = await res.json();

      if (!res.ok) {
        showToast({
          message: responseData.message || "Error al procesar la solicitud",
          type: "error"
        });
        console.warn("Error del servidor:", responseData.message);
        return;
      }

      showToast({
        message: mode === "edit"
          ? "Usuario actualizado correctamente"
          : "Usuario registrado correctamente",
        type: "success"
      });

      if (onSuccess) {
        await onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error("Error al procesar la solicitud:", error);
      showToast({
        message: "Error inesperado",
        type: "error"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl shadow-lg bg-card dark:bg-card-dark border border-border dark:border-border-dark">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Editar Usuario" : "Registrar Usuario"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {/* Imagen de perfil */}
          <div
            className="relative w-24 h-24 border-4 border-border rounded-full overflow-hidden cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {profileImage ? (
              <Image
                src={profileImage}
                alt="Imagen de perfil"
                className="object-cover w-full h-full"
                width={96}
                height={96}
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-muted text-muted-foreground">
                <span>+</span>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/png, image/jpeg"
            ref={fileInputRef}
            className="hidden"
            onChange={onImageChange}
          />

          {/* Datos de usuario */}
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="first_lastname">Primer Apellido *</Label>
            <Input id="first_lastname" {...register("first_lastname")} />
            {errors.first_lastname && (
              <p className="text-red-600">{errors.first_lastname.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="second_lastname">Segundo Apellido</Label>
            <Input id="second_lastname" {...register("second_lastname")} />
          </div>
          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" {...register("phone")} />
          </div>
          <div>
            <Label htmlFor="email">Correo *</Label>
            <Input id="email" {...register("email")} />
            {errors.email && (
              <p className="text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="username">Usuario *</Label>
            <Input id="username" {...register("username")} />
            {errors.username && (
              <p className="text-red-600">{errors.username.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="roleId">Rol *</Label>
            <Select
              defaultValue={initialData?.roleId?.toString() || ""}
              onValueChange={(value) => setValue("roleId", Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.length > 0 &&
                  roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.roleId && (
              <p className="text-red-600">{errors.roleId.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="password">Contraseña *</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-red-600">{errors.password.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="col-span-full flex justify-between">
            <Button
              className="bg-transparent hover:text-white"
              type="button"
              onClick={onClose}
            >
              Cerrar
            </Button>
            <Button type="submit" className="bg-transparent hover:text-white">
              {mode === "edit" ? "Actualizar" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
