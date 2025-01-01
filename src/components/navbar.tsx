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
import { useEffect } from "react";
import { useRef } from "react"; // Import useRef

export default function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const { profileImage, setProfileImage } = useUserStore();
  const usernameRef = useRef<string | null>(null);
  // Fetch profile image on mount
  useEffect(() => {
    const fetchProfileImage = async () => {
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
          usernameRef.current = data.user.username;
          setProfileImage(
            data.profile.image_profile
              ? `data:image/png;base64,${data.profile.image_profile}`
              : null
          );
        } else {
          console.error("Error fetching profile image");
        }
      } catch (error) {
        console.error("Error fetching profile image:", error);
      }
    };

    fetchProfileImage();
  }, [setProfileImage]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/logout/api", { method: "POST" });

      if (res.ok) {
        router.push("/login"); // Redirige al login después del logout
      } else {
        alert("Error al cerrar sesión");
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("Error al cerrar sesión");
    }
  };

  return (
    <header className="w-full bg-background dark:bg-background-dark border-b border-border dark:border-border-dark">
      <div className="flex items-center justify-between pl-4 pr-4 md:pr-6 lg:pr-8 py-4">
        {/* Contenedor del Botón Hamburguesa y Título */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Botón Hamburguesa en Pantallas Pequeñas y Medianas */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden" // Visible en pantallas menores a lg
            onClick={onMenuClick}
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
              src="/conecta_logo_transparente.png"
              alt="Logo"
              width={42}
              height={42}
              priority
              className="bg-transparent dark:bg-slate-200 p-1 rounded "
            />
            <span className="text-xl font-bold text-foreground dark:text-foreground-dark">
              ConectaTool
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
                      {usernameRef.current?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                {usernameRef.current}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="dropdown-menu bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-md shadow-md">
              <Link href="/profile">
                {/* Perfil */}
                <DropdownMenuItem className="hover:bg-accent hover:text-background transition">
                  <Image
                    src="/icons/profile.svg"
                    alt="Perfil"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  Perfil
                </DropdownMenuItem>
              </Link>
              {/* Cerrar Sesión */}
              <DropdownMenuItem
                onClick={handleLogout}
                className="hover:bg-accent hover:text-background transition"
              >
                <Image
                  src="/icons/logout.svg"
                  alt="Cerrar sesión"
                  width={20}
                  height={20}
                  className="mr-2 text-current"
                />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
