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

export default function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="w-full bg-background dark:bg-background-dark border-b border-border dark:border-border-dark">
      <div className="flex items-center justify-between pl-4 pr-4 sm:pr-6 lg:pr-8 py-4">
        {/* Logo y Título */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Logo y Título para Pantallas Pequeñas */}
          <div
            onClick={onMenuClick}
            className="flex items-center sm:hidden cursor-pointer"
          >
            <Image src="/logo.svg" alt="Logo" width={32} height={32} priority />
            <span className="text-xl font-bold text-foreground dark:text-foreground-dark ml-2">
              ConectaTool
            </span>
          </div>

          {/* Logo y Título para Pantallas Grandes */}
          <Link href="/" className="hidden sm:flex items-center space-x-2">
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
              <DropdownMenuItem>Cerrar sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
