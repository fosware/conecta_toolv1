"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { MenuItem } from "@/lib/menu";

export default function Sidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // Verificar si hay token antes de hacer el fetch
        const token = document.cookie.includes("token=");
        if (!token) {
          setMenuItems([]);
          return;
        }

        const res = await fetch("/api/menu", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          setMenuItems([]);
          return;
        }

        // Verificar que hay contenido antes de hacer parse
        const text = await res.text();
        if (!text) {
          setMenuItems([]);
          return;
        }

        // Intentar parsear el JSON
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          setMenuItems(data);
        } else {
          setMenuItems([]);
        }
      } catch (error) {
        // Silenciosamente limpiar el menú en caso de error
        console.error("Error al cerrar sesión:", error);
        setMenuItems([]);
      }
    };

    fetchMenu();
  }, []);

  return (
    <>
      {/* Sidebar fijo para pantallas grandes */}
      <aside className="hidden lg:block w-64 bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark border-r border-border dark:border-border-dark h-screen">
        <nav className="p-4">
          <ul className="space-y-4">
            {menuItems.map((item) => (
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
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Sidebar desplegable para pantallas medianas y pequeñas */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTitle></SheetTitle>
        <SheetContent
          side="left"
          className="w-68 bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark border-r border-border dark:border-border-dark"
          tabIndex={-1}
        >
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
          <nav className="mt-4">
            <ul className="space-y-4">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className="flex items-center space-x-3 px-4 py-2 rounded hover:bg-accent hover:text-background transition group"
                    onClick={() => setIsOpen(false)}
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
                </li>
              ))}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
