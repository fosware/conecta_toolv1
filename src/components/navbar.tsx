"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bars3Icon } from "@heroicons/react/24/outline";
import ThemeToggle from "@/components/theme-toggle";
import Link from "next/link";

export default function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="w-full bg-background dark:bg-background-dark border-b border-border dark:border-border-dark">
      <div className="container mx-auto flex items-center justify-between p-4">
        {/* Botón Hamburguesa */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={onMenuClick}
        >
          <Bars3Icon className=" w-6 h-6 text-foreground dark:text-foreground-dark" />
        </Button>

        {/* Título */}
        <Link
          href="/"
          className="text-xl font-bold text-foreground dark:text-foreground-dark hover:text-accent dark:hover:text-accent-dark transition"
        >
          Conecta Tool
        </Link>

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
