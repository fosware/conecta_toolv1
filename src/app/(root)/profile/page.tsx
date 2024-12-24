"use client";

import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileFormData } from "@/lib/schemas/profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useUserStore } from "@/lib/store/useUserState";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const [selectedFileName, setSelectedFileName] = useState<
    string | undefined
  >();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
  });

  const fetchProfileData = useCallback(async () => {
    try {
      const token = document.cookie.replace(
        /(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/,
        "$1"
      );

      const res = await fetch("/profile/api/get", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setProfileImage(data.profile.image_profile || null);

        // Actualiza el estado global
        useUserStore
          .getState()
          .setProfileImage(
            data.profile.image_profile
              ? `data:image/png;base64,${data.profile.image_profile}`
              : null
          );

        setValue("name", data.profile.name);
        setValue("first_lastname", data.profile.first_lastname);
        setValue("second_lastname", data.profile.second_lastname || "");
        setValue("phone", data.profile.phone || "");
        setValue("email", data.user.email);
        setValue("username", data.user.username);
      } else {
        console.error("Error fetching profile data");
        toast.error("Error interno del servidor.");
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      toast.error("Error interno del servidor.");
    }
  }, [setValue]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("first_lastname", data.first_lastname);
      if (data.second_lastname)
        formData.append("second_lastname", data.second_lastname);
      if (data.phone) formData.append("phone", data.phone);
      formData.append("email", data.email);
      formData.append("username", data.username);
      if (data.password) formData.append("password", data.password);
      if (data.image) formData.append("image", data.image);

      const res = await fetch("/profile/api/update", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${document.cookie.replace(
            /(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/,
            "$1"
          )}`,
        },
      });

      if (!res.ok) {
        try {
          const errorData = await res.json();
          console.error("Errors:", errorData.errors);
          toast.error(errorData.message || "Error al actualizar el perfil.");
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
          toast.error("Error desconocido al actualizar el perfil.");
        }
      } else {
        toast.success("Perfil actualizado correctamente.", {
          className: "toast-success",
        });

        await fetchProfileData();
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      toast.error("Error interno del servidor.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-3xl mx-auto overflow-hidden shadow-lg bg-card dark:bg-card-dark border border-border dark:border-border-dark">
        <CardHeader>
          <h2 className="text-xl font-bold text-foreground dark:text-foreground-dark">
            Editar Perfil
          </h2>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 overflow-auto max-h-[70vh] p-4"
          >
            {/* Imagen de Perfil */}
            <div className="flex items-center space-x-6">
              <div
                className="w-24 h-24 rounded-full overflow-hidden border-4 border-border dark:border-border-dark cursor-pointer hover:border-accent dark:hover:border-accent-light transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFileName && fileInputRef.current?.files?.[0] ? (
                  <Image
                    src={URL.createObjectURL(fileInputRef.current.files[0])}
                    alt="Imagen de Perfil"
                    className="object-cover w-full h-full"
                    width={96}
                    height={96}
                    onError={(e) =>
                      console.error(
                        "Error al cargar la imagen seleccionada:",
                        e
                      )
                    }
                  />
                ) : profileImage ? (
                  <Image
                    src={`data:image/png;base64,${profileImage}`}
                    alt="Imagen de Perfil"
                    className="object-cover w-full h-full"
                    width={96}
                    height={96}
                    onError={(e) => {
                      console.error("Error al cargar la imagen de perfil", e);
                      toast.error("Error al cargar la imagen de perfil");
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-muted text-muted-foreground">
                    Sin Imagen
                  </div>
                )}
              </div>
              <input
                id="image"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                {...register("image")}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFileName(file.name);
                    setProfileImage(URL.createObjectURL(file));
                    setValue("image", file);
                  } else {
                    setSelectedFileName(undefined);
                    setProfileImage(null);
                    setValue("image", undefined);
                  }
                }}
                ref={fileInputRef}
                className="hidden"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && (
                    <p className="text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="username">Usuario *</Label>
                  <Input id="username" {...register("username")} />
                  {errors.username && (
                    <p className="text-sm text-red-600">
                      {errors.username.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Resto de los campos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_lastname">Primer Apellido *</Label>
                <Input id="first_lastname" {...register("first_lastname")} />
                {errors.first_lastname && (
                  <p className="text-sm text-red-600">
                    {errors.first_lastname.message}
                  </p>
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
                <Label htmlFor="email">Email *</Label>
                <Input id="email" {...register("email")} />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
            <Button
              type="submit"
              className="w-full hover:bg-accent text-background"
            >
              Guardar Cambios
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
