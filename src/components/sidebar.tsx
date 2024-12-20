"use client";

import { menuItems } from "@/lib/menu";
import Link from "next/link";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import Image from "next/image";
import { HomeIcon } from "@heroicons/react/24/outline";

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Sidebar fijo para pantallas grandes */}
      <aside className="hidden sm:block w-64 bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark border-r border-border dark:border-border-dark h-screen">
        {/* Logo y Título */}

        {/* Menú de Navegación */}
        <nav className="p-4">
          <ul className="space-y-4">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className="flex items-center space-x-3 px-4 py-2 rounded hover:bg-accent hover:text-background transition"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Sidebar desplegable para pantallas pequeñas */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetTitle></SheetTitle>
        <SheetContent
          side="left"
          className="w-64 bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark border-r border-border dark:border-border-dark "
          tabIndex={-1}
        >
          {/* Logo y título visibles solo en pantallas pequeñas */}
          <div className="sm:hidden flex items-center space-x-3 px-4 py-4 border-b border-border dark:border-border-dark">
            <Image
              src="/logo.svg" // Asegúrate de que el logo esté en public/
              alt="Logo"
              width={32}
              height={32}
            />
            <span className="text-lg font-semibold text-foreground dark:text-foreground-dark">
              ConectaTool
            </span>
          </div>

          {/* Menú de Navegación */}
          <nav className="mt-4">
            <ul className="space-y-4">
              {/* Nueva opción "Home" */}
              <li>
                <Link
                  href="/"
                  className="flex items-center space-x-3 px-4 py-2 rounded hover:bg-accent hover:text-background transition"
                  onClick={onClose}
                >
                  <HomeIcon className="w-5 h-5" />
                  <span>Home</span>
                </Link>
              </li>
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className="flex items-center space-x-3 px-4 py-2 rounded hover:bg-accent hover:text-background transition"
                    onClick={onClose}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
