"use client";

import { ThemeProvider } from "next-themes";
import "../../(root)/globals.css";
import React from "react";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="h-screen flex items-center justify-center bg-background text-foreground">
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
