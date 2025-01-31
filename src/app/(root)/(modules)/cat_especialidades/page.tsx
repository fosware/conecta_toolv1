"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CatEspecialidadesTable } from "@/components/cat-especialidades-table";
import { CatAlcancesTable } from "@/components/cat-alcances-table";
import { CatSubalcancesTable } from "@/components/cat-subalcances-table";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { EditModal } from "@/components/modals/EditModal";
import { Especialidad, Alcance, Subalcance } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { getToken } from "@/lib/auth";

export default function CatEspecialidadesPage() {
  // Estados para las listas
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [alcances, setAlcances] = useState<Alcance[]>([]);
  const [subalcances, setSubalcances] = useState<Subalcance[]>([]);

  // Estados para la selección
  const [selectedEspecialidadId, setSelectedEspecialidadId] = useState<number>();
  const [selectedAlcanceId, setSelectedAlcanceId] = useState<number>();
  const [selectedSubalcanceId, setSelectedSubalcanceId] = useState<number>();

  // Estados para los modales de edición
  const [editEspecialidadModal, setEditEspecialidadModal] = useState<{ isOpen: boolean; item: Especialidad | null }>({
    isOpen: false,
    item: null,
  });
  const [editAlcanceModal, setEditAlcanceModal] = useState<{ isOpen: boolean; item: Alcance | null }>({
    isOpen: false,
    item: null,
  });
  const [editSubalcanceModal, setEditSubalcanceModal] = useState<{ isOpen: boolean; item: Subalcance | null }>({
    isOpen: false,
    item: null,
  });

  // Estados para la búsqueda
  const [searchEspecialidad, setSearchEspecialidad] = useState("");
  const [searchAlcance, setSearchAlcance] = useState("");
  const [searchSubalcance, setSearchSubalcance] = useState("");

  // Estados para la paginación
  const [especialidadesPage, setEspecialidadesPage] = useState(1);
  const [especialidadesTotalPages, setEspecialidadesTotalPages] = useState(1);
  const [alcancesPage, setAlcancesPage] = useState(1);
  const [alcancesTotalPages, setAlcancesTotalPages] = useState(1);
  const [subalcancesPage, setSubalcancesPage] = useState(1);
  const [subalcancesTotalPages, setSubalcancesTotalPages] = useState(1);

  // Estados para mostrar solo activos
  const [showActiveEspecialidades, setShowActiveEspecialidades] = useState(true);
  const [showActiveAlcances, setShowActiveAlcances] = useState(true);
  const [showActiveSubalcances, setShowActiveSubalcances] = useState(true);

  // Estados para la carga de datos
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true);
  const [loadingAlcances, setLoadingAlcances] = useState(false);
  const [loadingSubalcances, setLoadingSubalcances] = useState(false);

  // Funciones para cargar datos
  const loadEspecialidades = useCallback(async () => {
    try {
      setLoadingEspecialidades(true);
      const response = await fetch(
        `/cat_especialidades/api?page=${especialidadesPage}&search=${searchEspecialidad}&showActive=${showActiveEspecialidades}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      if (!response.ok) throw new Error("Error al cargar especialidades");
      const data = await response.json();
      setEspecialidades(data.items);
      setEspecialidadesTotalPages(data.totalPages);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setLoadingEspecialidades(false);
    }
  }, [especialidadesPage, searchEspecialidad, showActiveEspecialidades]);

  const loadAlcances = useCallback(async () => {
    if (!selectedEspecialidadId) {
      setAlcances([]);
      return;
    }
    try {
      setLoadingAlcances(true);
      const response = await fetch(
        `/cat_especialidades/api/alcances?specialtyId=${selectedEspecialidadId}&page=${alcancesPage}&search=${searchAlcance}&showActive=${showActiveAlcances}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      if (!response.ok) throw new Error("Error al cargar alcances");
      const data = await response.json();
      setAlcances(data.items);
      setAlcancesTotalPages(data.totalPages);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setLoadingAlcances(false);
    }
  }, [selectedEspecialidadId, alcancesPage, searchAlcance, showActiveAlcances]);

  const loadSubalcances = useCallback(async () => {
    if (!selectedAlcanceId) {
      setSubalcances([]);
      return;
    }
    try {
      setLoadingSubalcances(true);
      const response = await fetch(
        `/cat_especialidades/api/subalcances?scopeId=${selectedAlcanceId}&page=${subalcancesPage}&search=${searchSubalcance}&showActive=${showActiveSubalcances}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      if (!response.ok) throw new Error("Error al cargar subalcances");
      const data = await response.json();
      setSubalcances(data.items);
      setSubalcancesTotalPages(data.totalPages);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setLoadingSubalcances(false);
    }
  }, [selectedAlcanceId, subalcancesPage, searchSubalcance, showActiveSubalcances]);

  // Efectos para cargar datos
  useEffect(() => {
    const timer = setTimeout(() => {
      loadEspecialidades();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadEspecialidades]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAlcances();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadAlcances]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSubalcances();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadSubalcances]);

  // Handlers para Especialidades
  const handleEditEspecialidad = (especialidad: Especialidad) => {
    setEditEspecialidadModal({ isOpen: true, item: especialidad });
  };

  const handleDeleteEspecialidad = async (especialidad: Especialidad) => {
    try {
      const response = await fetch(`/cat_especialidades/api`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ id: especialidad.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar la especialidad");
      }

      setEspecialidades(prevEspecialidades =>
        prevEspecialidades.filter(esp => esp.id !== especialidad.id)
      );
      loadEspecialidades();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleSelectEspecialidad = (especialidad: Especialidad) => {
    setSelectedEspecialidadId(especialidad.id);
    setSelectedAlcanceId(undefined);
    setSubalcances([]);
  };

  // Handlers para Alcances
  const handleEditAlcance = (alcance: Alcance) => {
    setEditAlcanceModal({ isOpen: true, item: alcance });
  };

  const handleDeleteAlcance = async (alcance: Alcance) => {
    try {
      const response = await fetch(`/cat_especialidades/api/alcances`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ id: alcance.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar el alcance");
      }

      setAlcances(prevAlcances =>
        prevAlcances.filter(alc => alc.id !== alcance.id)
      );
      toast.success("Alcance eliminado correctamente");
      loadAlcances();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleSelectAlcance = (alcance: Alcance) => {
    setSelectedAlcanceId(alcance.id);
  };

  // Handlers para Subalcances
  const handleEditSubalcance = (subalcance: Subalcance) => {
    setEditSubalcanceModal({ isOpen: true, item: subalcance });
  };

  const handleDeleteSubalcance = async (subalcance: Subalcance) => {
    try {
      const response = await fetch(`/cat_especialidades/api/subalcances`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ id: subalcance.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar el subalcance");
      }

      setSubalcances(prevSubalcances =>
        prevSubalcances.filter(sub => sub.id !== subalcance.id)
      );
      toast.success("Subalcance eliminado correctamente");
      loadSubalcances();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleSelectSubalcance = (subalcance: Subalcance) => {
    setSelectedSubalcanceId(subalcance.id);
  };

  // Handlers para la paginación
  const handlePageChangeAlcances = (page: number) => {
    setAlcancesPage(page);
  };

  const handlePageChangeSubalcances = (page: number) => {
    setSubalcancesPage(page);
  };

  // Handlers para toggle status
  const handleToggleEspecialidadStatus = async (especialidad: Especialidad) => {
    try {
      if (!especialidad?.id) {
        toast.error("ID de especialidad no válido");
        return;
      }

      const response = await fetch(`/cat_especialidades/api/${especialidad.id}/toggle-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cambiar el estado de la especialidad");
      }

      const updatedEspecialidad = await response.json();
      setEspecialidades((prev) =>
        prev.map((esp) =>
          esp.id === updatedEspecialidad.id ? updatedEspecialidad : esp
        )
      );
      
      // Recargar la lista si está filtrando por activos
      if (showActiveEspecialidades) {
        loadEspecialidades();
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleToggleAlcanceStatus = async (alcance: Alcance) => {
    try {
      if (!alcance?.id) {
        toast.error("ID de alcance no válido");
        return;
      }

      const response = await fetch(`/cat_especialidades/api/alcances/${alcance.id}/toggle-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cambiar el estado del alcance");
      }

      const updatedAlcance = await response.json();
      setAlcances((prev) =>
        prev.map((alc) => (alc.id === updatedAlcance.id ? updatedAlcance : alc))
      );

      // Recargar la lista si está filtrando por activos
      if (showActiveAlcances) {
        loadAlcances();
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleToggleSubalcanceStatus = async (subalcance: Subalcance) => {
    try {
      if (!subalcance?.id) {
        toast.error("ID de subalcance no válido");
        return;
      }

      const response = await fetch(`/cat_especialidades/api/subalcances/${subalcance.id}/toggle-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cambiar el estado del subalcance");
      }

      const updatedSubalcance = await response.json();
      setSubalcances((prev) =>
        prev.map((sub) =>
          sub.id === updatedSubalcance.id ? updatedSubalcance : sub
        )
      );

      // Recargar la lista si está filtrando por activos
      if (showActiveSubalcances) {
        loadSubalcances();
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  // Handlers para crear nuevos registros
  const handleCreateEspecialidad = async () => {
    if (!searchEspecialidad.trim()) {
      toast.error("El nombre de la especialidad es obligatorio");
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        toast.error("No autorizado - Por favor inicie sesión nuevamente");
        return;
      }

      const response = await fetch("/cat_especialidades/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token.trim()}`
        },
        body: JSON.stringify({
          name: searchEspecialidad.trim()
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Error al crear la especialidad");
      }

      toast.success("Especialidad creada correctamente");
      setSearchEspecialidad("");
      loadEspecialidades();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleCreateAlcance = async () => {
    if (!selectedEspecialidadId) {
      toast.error("Debe seleccionar una especialidad");
      return;
    }

    if (!searchAlcance.trim()) {
      toast.error("El nombre del alcance es obligatorio");
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        toast.error("No autorizado");
        return;
      }

      const response = await fetch("/cat_especialidades/api/alcances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: searchAlcance.trim(),
          specialtyId: selectedEspecialidadId
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al crear el alcance");
      }

      toast.success("Alcance creado correctamente");
      setSearchAlcance("");
      loadAlcances();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleCreateSubalcance = async () => {
    try {
      if (!selectedAlcanceId) {
        toast.error("Debe seleccionar un alcance");
        return;
      }

      if (!searchSubalcance.trim()) {
        toast.error("El nombre del subalcance no puede estar vacío");
        return;
      }

      const response = await fetch("/cat_especialidades/api/subalcances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: searchSubalcance.trim(),
          scopeId: selectedAlcanceId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear el subalcance");
      }

      const newSubalcance = await response.json();
      setSubalcances((prev) => [...prev, newSubalcance]);
      setSearchSubalcance("");
      toast.success("Subalcance creado correctamente");
      loadSubalcances();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleSaveSubalcance = async (name: string) => {
    if (!editSubalcanceModal.item) return;

    try {
      const response = await fetch(`/cat_especialidades/api/subalcances`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          id: editSubalcanceModal.item.id,
          name: name.trim(),
          scopeId: editSubalcanceModal.item.scopeId,
          isActive: editSubalcanceModal.item.isActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar el subalcance");
      }

      const updatedSubalcance = await response.json();
      setSubalcances((prev) =>
        prev.map((sub) =>
          sub.id === updatedSubalcance.id ? updatedSubalcance : sub
        )
      );
      toast.success("Subalcance actualizado correctamente");
      setEditSubalcanceModal({ isOpen: false, item: null });
      loadSubalcances();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  // Handlers para edición
  const handleSaveEspecialidad = async (name: string) => {
    if (!editEspecialidadModal.item) return;

    try {
      const response = await fetch(`/cat_especialidades/api`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          id: editEspecialidadModal.item.id,
          name: name.trim(),
          isActive: editEspecialidadModal.item.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar la especialidad");
      }

      const updatedEspecialidad = await response.json();
      setEspecialidades((prev) =>
        prev.map((esp) =>
          esp.id === updatedEspecialidad.id ? updatedEspecialidad : esp
        )
      );
      toast.success("Especialidad actualizada correctamente");
      setEditEspecialidadModal({ isOpen: false, item: null });
      loadEspecialidades();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleSaveAlcance = async (name: string) => {
    if (!editAlcanceModal.item) return;

    try {
      const response = await fetch(`/cat_especialidades/api/alcances`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          id: editAlcanceModal.item.id,
          name: name.trim(),
          specialtyId: editAlcanceModal.item.specialtyId,
          isActive: editAlcanceModal.item.isActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar el alcance");
      }

      const updatedAlcance = await response.json();
      setAlcances((prev) =>
        prev.map((alc) =>
          alc.id === updatedAlcance.id ? updatedAlcance : alc
        )
      );
      toast.success("Alcance actualizado correctamente");
      setEditAlcanceModal({ isOpen: false, item: null });
      loadAlcances();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
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
                        placeholder="Buscar o agregar especialidad..."
                        value={searchEspecialidad}
                        onChange={(e) => {
                          setSearchEspecialidad(e.target.value);
                          setEspecialidadesPage(1);
                        }}
                        className="pl-8 min-w-[300px]"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="h-[40px] flex items-center">
                      <Button
                        onClick={handleCreateEspecialidad}
                        className="button-primary"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Especialidad
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
                onSelect={handleSelectEspecialidad}
                onEdit={handleEditEspecialidad}
                onDelete={handleDeleteEspecialidad}
                onToggleStatus={handleToggleEspecialidadStatus}
                selectedId={selectedEspecialidadId}
                showActive={showActiveEspecialidades}
                currentPage={especialidadesPage}
                totalPages={especialidadesTotalPages}
                onPageChange={setEspecialidadesPage}
                isLoading={loadingEspecialidades}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card de Alcances */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedEspecialidadId ? (
                <>
                  Alcances de{" "}
                  <span className="text-blue-900 dark:text-blue-500 font-semibold">
                    {especialidades.find(esp => esp.id === selectedEspecialidadId)?.name}
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
                        placeholder="Buscar o agregar alcance..."
                        value={searchAlcance}
                        onChange={(e) => {
                          setSearchAlcance(e.target.value);
                          setAlcancesPage(1);
                        }}
                        className="pl-8 min-w-[300px]"
                        disabled={!selectedEspecialidadId}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="h-[40px] flex items-center">
                      <Button 
                        onClick={handleCreateAlcance}
                        disabled={!selectedEspecialidadId}
                      >
                        <Plus className="h-4 w-4 md:hidden" />
                        <span className="hidden md:inline">
                          Agregar Alcance
                        </span>
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
                onSelect={handleSelectAlcance}
                onEdit={handleEditAlcance}
                onDelete={handleDeleteAlcance}
                onToggleStatus={handleToggleAlcanceStatus}
                selectedId={selectedAlcanceId}
                showActive={showActiveAlcances}
                currentPage={alcancesPage}
                totalPages={alcancesTotalPages}
                onPageChange={handlePageChangeAlcances}
                isLoading={loadingAlcances}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card de Subalcances */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedAlcanceId ? (
                <>
                  Subalcances de{" "}
                  <span className="text-blue-900 dark:text-blue-500 font-semibold">
                    {alcances.find(alc => alc.id === selectedAlcanceId)?.name}
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
                        placeholder="Buscar o agregar subalcance..."
                        value={searchSubalcance}
                        onChange={(e) => {
                          setSearchSubalcance(e.target.value);
                          setSubalcancesPage(1);
                        }}
                        className="pl-8 min-w-[300px]"
                        disabled={!selectedAlcanceId}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="h-[40px] flex items-center">
                      <Button 
                        onClick={handleCreateSubalcance}
                        disabled={!selectedAlcanceId}
                      >
                        <Plus className="h-4 w-4 md:hidden" />
                        <span className="hidden md:inline">
                          Agregar Subalcance
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
                onSelect={handleSelectSubalcance}
                onEdit={handleEditSubalcance}
                onDelete={handleDeleteSubalcance}
                onToggleStatus={handleToggleSubalcanceStatus}
                selectedId={selectedSubalcanceId}
                showActive={showActiveSubalcances}
                currentPage={subalcancesPage}
                totalPages={subalcancesTotalPages}
                onPageChange={handlePageChangeSubalcances}
                isLoading={loadingSubalcances}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modales de edición */}
      <EditModal
        isOpen={editEspecialidadModal.isOpen}
        onClose={() => setEditEspecialidadModal({ isOpen: false, item: null })}
        onSave={handleSaveEspecialidad}
        title="Editar Especialidad"
        currentName={editEspecialidadModal.item?.name || ""}
      />

      <EditModal
        isOpen={editAlcanceModal.isOpen}
        onClose={() => setEditAlcanceModal({ isOpen: false, item: null })}
        onSave={handleSaveAlcance}
        title="Editar Alcance"
        currentName={editAlcanceModal.item?.name || ""}
      />

      <EditModal
        isOpen={editSubalcanceModal.isOpen}
        onClose={() => setEditSubalcanceModal({ isOpen: false, item: null })}
        onSave={handleSaveSubalcance}
        title="Editar Subalcance"
        currentName={editSubalcanceModal.item?.name || ""}
      />
    </div>
  );
}
