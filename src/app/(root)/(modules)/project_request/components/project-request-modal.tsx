"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProjectRequestForm from "./project-request-form";

interface ProjectRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editItem?: any; // Tipo de solicitud de proyecto
}

export function ProjectRequestModal({
  open,
  onOpenChange,
  onSuccess,
  editItem,
}: ProjectRequestModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>
            {editItem ? "Editar Solicitud de Proyecto" : "Nueva Solicitud de Proyecto"}
          </DialogTitle>
        </DialogHeader>
        <ProjectRequestForm 
          onSuccess={() => {
            onSuccess();
            onOpenChange(false);
          }} 
          onClose={() => onOpenChange(false)}
          initialData={editItem}
        />
      </DialogContent>
    </Dialog>
  );
}
