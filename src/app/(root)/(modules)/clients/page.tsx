"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import React from "react";

const Clients = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          <PlusCircle className="h-6 w-6 mr-2" />
          Agregar cliente
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Input
          type="text"
          placeholder="Buscar cliente"
          className="flex-grow flex-1 min-w-[200px]"
        />
      </div>
    </div>
  );
};

export default Clients;
