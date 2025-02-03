"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { CatAlcancesTable } from "@/components/cat-alcances-table";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import type { Alcance } from "@/types";

// Tipo para los datos que vienen de la API
interface AlcanceAPI {
  id: number;
  name: string;
  num: number;
  specialtyId: number;
  isActive: boolean;
  description?: string;
}

// Función para convertir AlcanceAPI a Alcance
const mapToAlcance = (api: AlcanceAPI): Alcance => ({
  id: api.id,
  name: api.name,
  num: api.num,
  specialtyId: api.specialtyId,
  isActive: api.isActive,
  description: api.description,
  isDeleted: false,
  userId: 1,
  dateCreated: new Date(),
  dateUpdated: null
});

export default function AlcancesContent() {
  const [alcances, setAlcances] = useState<Alcance[]>([]);
  const [selectedId, setSelectedId] = useState<number>();
  const [searchTerm, setSearchTerm] = useState("");
  const [showActive, setShowActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const searchParams = useSearchParams();
  const specialtyId = searchParams.get("specialtyId");

  const loadAlcances = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      params.append("showActive", showActive.toString());
      if (specialtyId) params.append("specialtyId", specialtyId);
      params.append("page", currentPage.toString());

      const response = await fetch(
        `/cat_especialidades/api/alcances?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Error al cargar alcances");
      }
      const data = await response.json();
      // Mapear los datos de la API al tipo Alcance
      const mappedAlcances: Alcance[] = (data.items as AlcanceAPI[]).map(mapToAlcance);
      setAlcances(mappedAlcances);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar los alcances");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlcances();
  }, [searchTerm, showActive, specialtyId, currentPage]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setCurrentPage(1);
    loadAlcances();
  };

  const handleDelete = async (alcance: Alcance) => {
    try {
      // Actualización optimista
      const updatedAlcances = alcances.filter(a => a.id !== alcance.id);
      setAlcances(updatedAlcances);

      const response = await fetch(`/cat_especialidades/api/alcances/${alcance.id}/delete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...alcance,
          isDeleted: true,
          dateUpdated: new Date(),
        }),
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el alcance');
      }

      toast.success('Alcance eliminado correctamente');
    } catch (error) {
      console.error('Error:', error);
      // Revertir la actualización optimista
      loadAlcances();
      toast.error('Error al eliminar el alcance');
    }
  };

  const handleEdit = (alcance: Alcance) => {
    // Implementar lógica de edición
    console.log('Editar alcance:', alcance);
  };

  const handleToggleStatus = async (alcance: Alcance) => {
    try {
      const response = await fetch(`/cat_especialidades/api/alcances/${alcance.id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...alcance,
          isActive: !alcance.isActive,
          dateUpdated: new Date(),
        }),
      });
      if (!response.ok) throw new Error('Error al cambiar el estado del alcance');
      toast.success('Estado actualizado correctamente');
      loadAlcances();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cambiar el estado del alcance');
    }
  };

  const handleSelect = (alcance: Alcance) => {
    setSelectedId(alcance.id);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="rounded-md border">
        <div className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <Input
              placeholder="Buscar alcances..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button type="submit" variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
        <CatAlcancesTable
          alcances={alcances}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onSelect={handleSelect}
          selectedId={selectedId}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
          showActive={showActive}
        />
      </div>
    </div>
  );
}
