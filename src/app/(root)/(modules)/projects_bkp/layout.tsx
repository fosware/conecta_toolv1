"use client";

import React from "react";
import { UnreadMessagesProvider } from "@/app/(root)/(modules)/project_logs/context/unread-messages-context";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UnreadMessagesProvider>
      {children}
    </UnreadMessagesProvider>
  );
}
