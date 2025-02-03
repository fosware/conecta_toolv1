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
  question: string; 
  onConfirm: () => void; 
  trigger: ReactNode; 
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
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Confirmación</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {question}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="text-foreground hover:bg-secondary"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
