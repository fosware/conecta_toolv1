"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { CatAlcancesTable } from "@/components/cat-alcances-table";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

interface Alcance {
  id: number;
  name: string;
  num: number;
  description?: string;
  specialtyId: number;
  isActive: boolean;
}

export default function CatAlcancesPage() {
  const [alcances, setAlcances] = useState<Alcance[]>([]);
  const [selectedId, setSelectedId] = useState<number>();
  const [searchTerm, setSearchTerm] = useState("");
  const [showActive, setShowActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const specialtyId = searchParams.get("specialtyId");

  const loadAlcances = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      params.append("showActive", showActive.toString());
      if (specialtyId) params.append("specialtyId", specialtyId);

      const response = await fetch(
        `/cat_especialidades/api/alcances?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Error al cargar alcances");
      }
      const data = await response.json();
      setAlcances(data.items);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar los alcances");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlcances();
  }, [searchTerm, showActive, specialtyId]);

  const handleEdit = (alcance: Alcance) => {
    // TODO: Implementar edición
    console.log("Editar:", alcance);
  };

  const handleDelete = async (alcance: Alcance) => {
    try {
      const response = await fetch(
        `/cat_especialidades/api/alcances?id=${alcance.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el alcance");
      }

      toast.success("Alcance eliminado correctamente");
      loadAlcances();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar el alcance");
    }
  };

  const handleSelect = (alcance: Alcance) => {
    setSelectedId(alcance.id);
  };

  const handleToggleStatus = (alcance: Alcance) => {
    const updatedAlcances = alcances.map((a) =>
      a.id === alcance.id ? { ...a, isActive: !a.isActive } : a
    );
    setAlcances(updatedAlcances);
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar alcance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 min-w-[300px]"
            />
          </div>
        </div>
      </div>

      <CatAlcancesTable
        alcances={alcances}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSelect={handleSelect}
        onToggleStatus={handleToggleStatus}
        selectedId={selectedId}
        showActive={showActive}
        onShowActiveChange={setShowActive}
      />
    </div>
  );
}
