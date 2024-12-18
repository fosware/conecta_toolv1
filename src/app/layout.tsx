"use client";

import { ThemeProvider } from "next-themes";
import "./globals.css";
import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { useState } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>ConectaTool</title>
        <meta
          name="description"
          content="ConectaTool - Tu plataforma de gestión y productividad"
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="h-screen flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          {/* Navbar */}
          <Navbar onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center mt-8">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
