"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "@/components/theme-toggle";
import Link from "next/link";
import Image from "next/image";
import { useUserStore } from "@/lib/store/useUserState";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, User } from "lucide-react";
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

export default function Navbar({
  isSidebarOpen,
  setSidebarOpen,
}: {
  isSidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const { profileImage, setProfileImage } = useUserStore();
  const [username, setUsername] = useState<string | null>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Fetch profile image on mount
  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        // Verificar si hay token antes de hacer el fetch
        const token = document.cookie.includes("token=");
        if (!token) {
          setProfileImage(null);
          setUsername(null);
          return;
        }

        const res = await fetch("/profile/api/get", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          // Si la respuesta no es ok, limpiar el estado y salir
          setProfileImage(null);
          setUsername(null);
          return;
        }

        // Verificar que hay contenido antes de hacer parse
        const text = await res.text();
        if (!text) {
          setProfileImage(null);
          setUsername(null);
          return;
        }

        // Intentar parsear el JSON
        const data = JSON.parse(text);
        if (data?.user?.username) {
          setUsername(data.user.username);
        } else {
          setUsername(null);
        }

        if (data?.profile?.image_profile) {
          setProfileImage(
            `data:image/png;base64,${data.profile.image_profile}`
          );
        } else {
          setProfileImage(null); // Asegurarnos de limpiar la imagen si el usuario no tiene una
        }
      } catch {
        // Limpiar estado en caso de error
        setProfileImage(null);
        setUsername(null);
      }
    };

    fetchProfileImage();
  }, [setProfileImage]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/logout/api", {
        method: "POST",
      });

      if (res.ok) {
        setProfileImage(null); // Limpiar la imagen antes de redirigir
        setUsername(null);
        router.push("/login"); // Redirige al login después del logout
      } else {
        // Reemplazamos el alert por un manejo de error más elegante
        console.error("Error al cerrar sesión");
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const openLogoutDialog = () => {
    setLogoutDialogOpen(true);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-[#EEF1F6] dark:border-[#1D2532]">
      <div className="flex items-center justify-between pl-4 pr-4 md:pr-6 lg:pr-8 py-4">
        {/* Contenedor del Botón Hamburguesa y Título */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Botón Hamburguesa en Pantallas Pequeñas y Medianas */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden" // Visible en pantallas menores a lg
            onClick={() => setSidebarOpen(!isSidebarOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 text-foreground dark:text-foreground-dark"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 5.75h16.5m-16.5 6h16.5m-16.5 6h16.5"
              />
            </svg>
          </Button>

          {/* Logo y Título */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo100.png"
              alt="Logo"
              width={42}
              height={42}
              priority
              className="bg-transparent dark:bg-slate-200 rounded "
            />
            <span className="text-xl font-bold text-foreground dark:text-foreground-dark">
              Tooling Cluster
            </span>
          </Link>
        </div>

        {/* Menú de Usuario y Toggle */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="hover:bg-transparent focus:outline-none"
              >
                <Avatar className="h-8 w-8 dark:bg-muted-dark">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt="Avatar"
                      className="h-full w-full object-cover rounded-full"
                      width={32}
                      height={32}
                    />
                  ) : (
                    <AvatarFallback className="text-foreground">
                      {username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                {username}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="dropdown-menu bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-md shadow-md">
              <Link href="/profile">
                {/* Perfil */}
                <DropdownMenuItem className="hover:bg-accent hover:text-accent-foreground transition cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
              </Link>
              {/* Cerrar Sesión */}
              <DropdownMenuItem
                onClick={openLogoutDialog}
                className="hover:bg-accent hover:text-accent-foreground transition cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Diálogo de confirmación para cerrar sesión */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cerrar sesión?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Cerrar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
}
