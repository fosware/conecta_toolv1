"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReactNode, useState } from "react";

interface ConfirmationDialogProps {
  question: string; // Pregunta que se mostrará
  onConfirm: () => void; // Acción a ejecutar si se confirma
  trigger: ReactNode; // Componente que abrirá el diálogo
}

export const ConfirmationDialog = ({
  question,
  onConfirm,
  trigger,
}: ConfirmationDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-card dark:bg-card-dark border border-border dark:border-border-dark">
        <DialogHeader className="space-y-3">
          <DialogTitle>Confirmación</DialogTitle>
          <DialogDescription>{question}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button className="bg-transparent" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button className="bg-transparent" onClick={handleConfirm}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
