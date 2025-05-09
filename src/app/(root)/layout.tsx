"use client";

import { ThemeProvider } from "next-themes";
import "./globals.css";
import Navbar from "../../components/navbar";
import Sidebar from "../../components/sidebar";
import { useState } from "react";
import React from "react";
import { Toaster } from "react-hot-toast";
import { UnreadMessagesProvider } from "../(root)/(modules)/project_request_logs/context/unread-messages-context";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
        <UnreadMessagesProvider>
          <Toaster
            position="bottom-right"
            reverseOrder={false}
            toastOptions={{
              success: {
                style: {
                  backgroundColor: "var(--background)", 
                  color: "var(--accent)", 
                  border: "1px solid var(--accent)", 
                },
                iconTheme: {
                  primary: "var(--accent)",
                  secondary: "var(--background)",
                },
              },
              error: {
                style: {
                  backgroundColor: "var(--background)",
                  color: "var(--destructive)",
                  border: "1px solid var(--destructive)",
                },
              },
            }}
          />
          <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
          <div className="flex flex-1 overflow-hidden pt-16 bg-background dark:bg-background-dark">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
            <main className="flex-1 overflow-y-auto p-4 bg-background dark:bg-background-dark w-full">
              {children}
            </main>
          </div>
        </UnreadMessagesProvider>
      </ThemeProvider>
    </div>
  );
}
