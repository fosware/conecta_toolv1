"use client";

import { ThemeProvider } from "next-themes";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import "./(root)/globals.css";

export default function NotFound() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Image
              src="/404.webp" // Cambia por la ruta de tu imagen personalizada
              alt="Dinosaurio Perdido"
              objectFit="contain"
              priority
              height={380}
              width={380}
            />
          </div>
          <h1 className="text-4xl font-bold mt-4">404</h1>
          <p className="text-lg text-muted-foreground">
            ¿Encontraste esta página? No es lo que buscabas.
          </p>
          <Link
            href="/"
            className="mt-6 text-accent underline hover:text-accent-light"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </ThemeProvider>
  );
}
