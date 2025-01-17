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
        const token = document.cookie.replace(
          /(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/,
          "$1"
        );

        const res = await fetch("/api/menu", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setMenuItems(data);
        } else {
          console.error("Error al obtener el menú:", await res.json());
        }
      } catch (error) {
        console.error("Error al realizar fetch del menú:", error);
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
          className="w-64 bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark border-r border-border dark:border-border-dark"
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
