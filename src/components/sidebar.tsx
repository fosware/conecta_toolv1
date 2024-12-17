"use client";
import { menuItems } from "@/lib/menu";
import Link from "next/link";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

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
        <nav className="p-4">
          <ul className="space-y-4">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className="flex items-center space-x-3 px-4 py-2 rounded hover:bg-accent hover:text-background transition"
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
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
          className="w-64 bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark border-r border-gray-300 dark:border-gray-700"
          tabIndex={-1}
        >
          <nav className="mt-4">
            <ul className="space-y-4">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className="flex items-center space-x-3 px-4 py-2 rounded hover:bg-accent hover:text-background transition"
                    onClick={onClose}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
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
