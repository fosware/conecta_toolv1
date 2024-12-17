"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react"; // Iconos de ShadCN

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita el renderizado hasta que el componente esté montado
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // No renderizar nada hasta que el tema esté cargado
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="hover:bg-transparent bg-transparent focus:outline-none border-none"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="w-6 h-6 text-yellow-300" />
      ) : (
        <Moon className="h-6 w-6 text-gray-700" />
      )}
    </Button>
  );
}
