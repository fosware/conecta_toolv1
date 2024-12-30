"use client";

import { ThemeProvider } from "next-themes";
import "../(root)/globals.css";
import React from "react";
import { Toaster } from "react-hot-toast";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="h-screen flex items-center justify-center bg-background text-foreground">
        <Toaster
          position="bottom-right"
          reverseOrder={false}
          toastOptions={{
            success: {
              style: {
                backgroundColor: "rgb(242, 242, 242)", // Color de éxito
                color: "green", // Texto contrastante
                border: "1px solid var(--accent-dark)", // Borde más oscuro
              },
              iconTheme: {
                primary: "var(--background)", // Color del ícono
                secondary: "var(--accent)", // Fondo del ícono
              },
            },
            error: {
              style: {
                backgroundColor: "rgb(242, 242, 242)", //"var(--destructive)", // Color de error
                color: "red", // Texto contrastante
                border: "1px solid var(--destructive-dark)", // Borde más oscuro
              },
            },
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
