"use client";

import { menuItems } from "@/lib/menu";
import Link from "next/link";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import Image from "next/image";
import { useUserStore } from "@/lib/store/useUserState";

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { role } = useUserStore();

  // Agregar subitems dinámicamente para Administración
  const adminSubItems = [
    { name: "Usuarios Staff", path: "/administracion/usuarios-staff" },
  ];

  // Filtrar y ordenar menú (Administración al final si es Admin)
  const filteredMenuItems = [
    ...menuItems.filter((item) => item.name !== "Administración"),
    ...(role === "Admin"
      ? [
          {
            name: "Administración",
            path: "/administracion",
            icon: "/icons/admin.svg",
            subItems: adminSubItems,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Sidebar fijo para pantallas grandes */}
      <aside className="hidden lg:block w-64 bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark border-r border-border dark:border-border-dark h-screen">
        {/* Menú de Navegación */}
        <nav className="p-4">
          <ul className="space-y-4">
            {filteredMenuItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className="flex items-center space-x-3 px-4 py-2 rounded hover:bg-accent hover:text-background transition group"
                >
                  <Image
                    src={item.icon}
                    alt={`${item.name} Icon`}
                    width={24}
                    height={24}
                    className="dark:invert dark:backdrop-brightness-1"
                  />
                  <span className="hidden lg:inline">{item.name}</span>
                </Link>
                {/* Subitems dinámicos para "Administración" */}
                {"subItems" in item && item.subItems?.length && (
                  <ul className="pl-6 mt-2 space-y-2">
                    {item.subItems.map((subItem) => (
                      <li key={subItem.path}>
                        <Link
                          href={subItem.path}
                          className="block px-4 py-2 rounded hover:bg-muted transition"
                        >
                          {subItem.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Sidebar desplegable para pantallas medianas y pequeñas */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetTitle></SheetTitle>
        <SheetContent
          side="left"
          className="w-64 bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark border-r border-border dark:border-border-dark"
          tabIndex={-1}
        >
          {/* Logo y título visibles solo en pantallas pequeñas */}
          <div className="lg:hidden flex items-center space-x-3 px-4 py-4 border-b border-border dark:border-border-dark">
            <Image
              src="/conecta_logo_transparente.png"
              alt="Logo"
              width={42}
              height={42}
              className="bg-transparent dark:bg-slate-200 p-1 rounded"
            />
            <span className="text-lg font-semibold text-foreground dark:text-foreground-dark">
              ConectaTool
            </span>
          </div>
          {/* Menú de Navegación */}
          <nav className="mt-4">
            <ul className="space-y-4">
              {filteredMenuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className="flex items-center space-x-3 px-4 py-2 rounded hover:bg-accent hover:text-background transition group"
                    onClick={onClose}
                  >
                    <Image
                      src={item.icon}
                      alt={`${item.name} Icon`}
                      width={24}
                      height={24}
                      className="dark:invert dark:backdrop-brightness-1"
                    />
                    <span>{item.name}</span>
                  </Link>
                  {/* Subitems dinámicos para "Administración" */}
                  {"subItems" in item && item.subItems?.length && (
                    <ul className="pl-6 mt-2 space-y-2">
                      {item.subItems.map((subItem) => (
                        <li key={subItem.path}>
                          <Link
                            href={subItem.path}
                            className="flex items-center space-x-3 px-4 py-2 rounded hover:bg-accent hover:text-background transition"
                            onClick={onClose}
                          >
                            {subItem.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
