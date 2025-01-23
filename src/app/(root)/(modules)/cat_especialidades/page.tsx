"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { CatEspecialidadesTable } from "@/components/cat-especialidades-table";
import { CatAlcancesTable } from "@/components/cat-alcances-table";
import { CatSubalcancesTable } from "@/components/cat-subalcances-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface Especialidad {
  id: number;
  name: string;
  num: number;
  description?: string;
  isActive: boolean;
}

interface Alcance {
  id: number;
  name: string;
  num: number;
  description?: string;
  specialtyId: number;
  isActive: boolean;
}

interface Subalcance {
  id: number;
  name: string;
  num: number;
  description?: string;
  scopeId: number;
  isActive: boolean;
}

export default function CatEspecialidadesPage() {
  // Estados para Especialidades
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [selectedEspecialidadId, setSelectedEspecialidadId] =
    useState<number>();
  const [selectedEspecialidad, setSelectedEspecialidad] =
    useState<Especialidad | null>(null);
  const [searchEspecialidad, setSearchEspecialidad] = useState("");
  const [showActiveEspecialidades, setShowActiveEspecialidades] =
    useState(true);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true);
  const [currentPageEspecialidades, setCurrentPageEspecialidades] = useState(1);
  const [totalPagesEspecialidades, setTotalPagesEspecialidades] = useState(1);

  // Estados para Alcances
  const [alcances, setAlcances] = useState<Alcance[]>([]);
  const [selectedAlcanceId, setSelectedAlcanceId] = useState<number>();
  const [selectedAlcance, setSelectedAlcance] = useState<Alcance | null>(null);
  const [searchAlcance, setSearchAlcance] = useState("");
  const [showActiveAlcances, setShowActiveAlcances] = useState(true);
  const [loadingAlcances, setLoadingAlcances] = useState(false);
  const [currentPageAlcances, setCurrentPageAlcances] = useState(1);
  const [totalPagesAlcances, setTotalPagesAlcances] = useState(1);

  // Estados para Subalcances
  const [subalcances, setSubalcances] = useState<Subalcance[]>([]);
  const [selectedSubalcanceId, setSelectedSubalcanceId] = useState<number>();
  const [searchSubalcance, setSearchSubalcance] = useState("");
  const [showActiveSubalcances, setShowActiveSubalcances] = useState(true);
  const [loadingSubalcances, setLoadingSubalcances] = useState(false);
  const [currentPageSubalcances, setCurrentPageSubalcances] = useState(1);
  const [totalPagesSubalcances, setTotalPagesSubalcances] = useState(1);

  // Cargar Especialidades
  const loadEspecialidades = async () => {
    try {
      setLoadingEspecialidades(true);
      const searchParams = new URLSearchParams();
      if (searchEspecialidad) searchParams.append("search", searchEspecialidad);
      searchParams.append("showActive", showActiveEspecialidades.toString());
      searchParams.append("page", currentPageEspecialidades.toString());
      searchParams.append("limit", "10");

      const response = await fetch(
        `/cat_especialidades/api/?${searchParams.toString()}`
      );
      if (!response.ok) throw new Error("Error al cargar especialidades");

      const data = await response.json();
      setEspecialidades(data.items);
      setTotalPagesEspecialidades(data.totalPages);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar las especialidades");
    } finally {
      setLoadingEspecialidades(false);
    }
  };

  // Cargar Alcances
  const loadAlcances = async () => {
    if (!selectedEspecialidadId) {
      setAlcances([]);
      return;
    }

    try {
      setLoadingAlcances(true);
      const searchParams = new URLSearchParams();
      if (searchAlcance) searchParams.append("search", searchAlcance);
      searchParams.append("showActive", showActiveAlcances.toString());
      searchParams.append("specialtyId", selectedEspecialidadId.toString());
      searchParams.append("page", currentPageAlcances.toString());
      searchParams.append("limit", "10");

      const response = await fetch(
        `/cat_especialidades/api/alcances?${searchParams.toString()}`
      );
      if (!response.ok) throw new Error("Error al cargar alcances");

      const data = await response.json();
      setAlcances(data.items);
      setTotalPagesAlcances(data.totalPages);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar los alcances");
    } finally {
      setLoadingAlcances(false);
    }
  };

  // Cargar Subalcances
  const loadSubalcances = async () => {
    if (!selectedAlcanceId) {
      setSubalcances([]);
      return;
    }

    try {
      setLoadingSubalcances(true);
      const searchParams = new URLSearchParams();
      if (searchSubalcance) searchParams.append("search", searchSubalcance);
      searchParams.append("showActive", showActiveSubalcances.toString());
      searchParams.append("scopeId", selectedAlcanceId.toString());
      searchParams.append("page", currentPageSubalcances.toString());
      searchParams.append("limit", "10");

      const response = await fetch(
        `/cat_especialidades/api/subalcances?${searchParams.toString()}`
      );
      if (!response.ok) throw new Error("Error al cargar subalcances");

      const data = await response.json();
      setSubalcances(data.items);
      setTotalPagesSubalcances(data.totalPages);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar los subalcances");
    } finally {
      setLoadingSubalcances(false);
    }
  };

  // Efectos para cargar datos
  useEffect(() => {
    loadEspecialidades();
  }, [searchEspecialidad, showActiveEspecialidades, currentPageEspecialidades]);

  useEffect(() => {
    setCurrentPageAlcances(1);
    loadAlcances();
  }, [selectedEspecialidadId, searchAlcance, showActiveAlcances]);

  useEffect(() => {
    if (currentPageAlcances > 1) {
      loadAlcances();
    }
  }, [currentPageAlcances]);

  useEffect(() => {
    setCurrentPageSubalcances(1);
    loadSubalcances();
  }, [selectedAlcanceId, searchSubalcance, showActiveSubalcances]);

  useEffect(() => {
    if (currentPageSubalcances > 1) {
      loadSubalcances();
    }
  }, [currentPageSubalcances]);

  // Handlers para Especialidades
  const handleEditEspecialidad = (especialidad: Especialidad) => {
    console.log("Editar especialidad:", especialidad);
  };

  const handleDeleteEspecialidad = async (especialidad: Especialidad) => {
    try {
      const response = await fetch(
        `/cat_especialidades/api?id=${especialidad.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Error al eliminar la especialidad");

      toast.success("Especialidad eliminada correctamente");
      loadEspecialidades();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar la especialidad");
    }
  };

  const handleSelectEspecialidad = (especialidad: Especialidad) => {
    setSelectedEspecialidadId(especialidad.id);
    setSelectedEspecialidad(especialidad);
    setSelectedAlcanceId(undefined);
    setSubalcances([]);
  };

  // Handlers para Alcances
  const handleEditAlcance = (alcance: Alcance) => {
    console.log("Editar alcance:", alcance);
  };

  const handleDeleteAlcance = async (alcance: Alcance) => {
    try {
      const response = await fetch(
        `/cat_especialidades/api/alcances?id=${alcance.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Error al eliminar el alcance");

      toast.success("Alcance eliminado correctamente");
      loadAlcances();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar el alcance");
    }
  };

  const handleSelectAlcance = (alcance: Alcance) => {
    setSelectedAlcanceId(alcance.id);
    setSelectedAlcance(alcance);
  };

  // Handlers para Subalcances
  const handleEditSubalcance = (subalcance: Subalcance) => {
    console.log("Editar subalcance:", subalcance);
  };

  const handleDeleteSubalcance = async (subalcance: Subalcance) => {
    try {
      const response = await fetch(
        `/cat_especialidades/api/subalcances?id=${subalcance.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Error al eliminar el subalcance");

      toast.success("Subalcance eliminado correctamente");
      loadSubalcances();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar el subalcance");
    }
  };

  const handleSelectSubalcance = (subalcance: Subalcance) => {
    setSelectedSubalcanceId(subalcance.id);
  };

  const fetchEspecialidades = () => {
    loadEspecialidades();
  };

  const fetchAlcances = () => {
    loadAlcances();
  };

  const fetchSubalcances = () => {
    loadSubalcances();
  };

  const handlePageChangeAlcances = (page: number) => {
    setCurrentPageAlcances(page);
  };

  const handlePageChangeSubalcances = (page: number) => {
    setCurrentPageSubalcances(page);
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Card de Especialidades */}
        <Card>
          <CardHeader>
            <CardTitle>Especialidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex flex-row gap-2 md:gap-4 flex-1">
                  <div className="flex-1">
                    <label
                      htmlFor="search-especialidad"
                      className="text-sm font-medium mb-2 block"
                    >
                      Buscar especialidad
                    </label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-especialidad"
                        placeholder="Buscar especialidad..."
                        value={searchEspecialidad}
                        onChange={(e) => setSearchEspecialidad(e.target.value)}
                        className="pl-8 min-w-[300px]"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="h-[40px] flex items-center">
                      <Button>
                        <Plus className="h-4 w-4 md:hidden" />
                        <span className="hidden md:inline">
                          Nueva Especialidad
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <div className="h-[40px] flex items-center">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={showActiveEspecialidades}
                        onCheckedChange={setShowActiveEspecialidades}
                      />
                      <span className="text-sm">Mostrar solo activos</span>
                    </div>
                  </div>
                </div>
              </div>

              <CatEspecialidadesTable
                especialidades={especialidades}
                onEdit={handleEditEspecialidad}
                onDelete={handleDeleteEspecialidad}
                onSelect={handleSelectEspecialidad}
                onRefresh={fetchEspecialidades}
                onToggleStatus={(esp) => {
                  const updated = especialidades.map((e) =>
                    e.id === esp.id ? { ...e, isActive: !e.isActive } : e
                  );
                  setEspecialidades(updated);
                }}
                selectedId={selectedEspecialidadId}
                showActive={showActiveEspecialidades}
                onShowActiveChange={setShowActiveEspecialidades}
                currentPage={currentPageEspecialidades}
                totalPages={totalPagesEspecialidades}
                onPageChange={setCurrentPageEspecialidades}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card de Alcances */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedEspecialidad ? (
                <>
                  Alcances de{" "}
                  <span className="text-blue-900 dark:text-blue-500 font-semibold">
                    {selectedEspecialidad.name}
                  </span>
                </>
              ) : (
                "Alcances"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex flex-row gap-2 md:gap-4 flex-1">
                  <div className="flex-1">
                    <label
                      htmlFor="search-alcance"
                      className="text-sm font-medium mb-2 block"
                    >
                      Buscar alcance
                    </label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-alcance"
                        placeholder="Buscar alcance..."
                        value={searchAlcance}
                        onChange={(e) => setSearchAlcance(e.target.value)}
                        className="pl-8 min-w-[300px]"
                        disabled={!selectedEspecialidadId}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="h-[40px] flex items-center">
                      <Button disabled={!selectedEspecialidadId}>
                        <Plus className="h-4 w-4 md:hidden" />
                        <span className="hidden md:inline">Nuevo Alcance</span>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <div className="h-[40px] flex items-center">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={showActiveAlcances}
                        onCheckedChange={setShowActiveAlcances}
                      />
                      <span className="text-sm">Mostrar solo activos</span>
                    </div>
                  </div>
                </div>
              </div>

              <CatAlcancesTable
                alcances={alcances}
                selectedId={selectedAlcanceId}
                onSelect={handleSelectAlcance}
                onRefresh={fetchAlcances}
                currentPage={currentPageAlcances}
                totalPages={totalPagesAlcances}
                onPageChange={handlePageChangeAlcances}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card de Subalcances */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedAlcance ? (
                <>
                  Subalcances de{" "}
                  <span className="text-blue-900 dark:text-blue-500 font-semibold">
                    {selectedAlcance.name}
                  </span>
                </>
              ) : (
                "Subalcances"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex flex-row gap-2 md:gap-4 flex-1">
                  <div className="flex-1">
                    <label
                      htmlFor="search-subalcance"
                      className="text-sm font-medium mb-2 block"
                    >
                      Buscar subalcance
                    </label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-subalcance"
                        placeholder="Buscar subalcance..."
                        value={searchSubalcance}
                        onChange={(e) => setSearchSubalcance(e.target.value)}
                        className="pl-8 min-w-[300px]"
                        disabled={!selectedAlcanceId}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="h-[40px] flex items-center">
                      <Button disabled={!selectedAlcanceId}>
                        <Plus className="h-4 w-4 md:hidden" />
                        <span className="hidden md:inline">
                          Nuevo Subalcance
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <div className="h-[40px] flex items-center">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={showActiveSubalcances}
                        onCheckedChange={setShowActiveSubalcances}
                      />
                      <span className="text-sm">Mostrar solo activos</span>
                    </div>
                  </div>
                </div>
              </div>

              <CatSubalcancesTable
                subalcances={subalcances}
                selectedId={selectedSubalcanceId}
                onSelect={handleSelectSubalcance}
                onRefresh={fetchSubalcances}
                currentPage={currentPageSubalcances}
                totalPages={totalPagesSubalcances}
                onPageChange={handlePageChangeSubalcances}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
