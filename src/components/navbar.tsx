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
import { useRouter } from "next/navigation";

export default function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
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
      <div className="flex items-center justify-between pl-4 pr-4 sm:pr-6 lg:pr-8 py-4">
        {/* Contenedor del Botón Hamburguesa y Título */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Botón Hamburguesa en Pantallas Pequeñas */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
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
            <Image src="/logo.svg" alt="Logo" width={32} height={32} priority />
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
                size="icon"
                className="hover:bg-transparent focus:outline-none"
              >
                <Avatar className="h-8 w-8 dark:bg-muted-dark">
                  <AvatarFallback className="text-foreground">U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="dropdown-menu bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-md shadow-md">
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
