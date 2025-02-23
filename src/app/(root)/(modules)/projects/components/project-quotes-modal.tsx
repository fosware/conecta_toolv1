"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Project, ProjectQuote as ProjectQuoteType, Company } from "@/types";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectQuotesTable } from "./project-quotes-table";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { Especialidad, Alcance, Subalcance } from "@/types";

interface ProjectQuotesModalProps {
  project: Project;
  onClose: () => void;
}

export function ProjectQuotesModal({ project, onClose }: ProjectQuotesModalProps) {
  const [quotes, setQuotes] = useState<ProjectQuoteType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [specialties, setSpecialties] = useState<Especialidad[]>([]);
  const [scopes, setScopes] = useState<Alcance[]>([]);
  const [subscopes, setSubscopes] = useState<Subalcance[]>([]);
  const [certifications, setCertifications] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Partial<ProjectQuoteType> | null>(null);
  const [filters, setFilters] = useState({
    specialtyId: "",
    scopeId: "" as string,
    subscopeId: "" as string,
    certificationIds: [] as string[],
  });

  useEffect(() => {
    loadSpecialties();
    loadCertifications();
    loadQuotes();
  }, []);

  useEffect(() => {
    if (editingQuote?.company) {
      // Asegurarnos que la empresa de la cotización esté en el listado
      setCompanies(prev => {
        const exists = prev.some(c => c.id === editingQuote.company?.id);
        if (!exists && editingQuote.company) {
          return [...prev, editingQuote.company];
        }
        return prev;
      });

      // Cargar todas las empresas al editar
      loadCompanies();
    }
  }, [editingQuote]);

  const loadCertifications = async () => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const response = await fetch("/api/cat_certificaciones", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCertifications(data.certificaciones);
    } catch (error) {
      console.error("Error cargando certificaciones:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar certificaciones");
    }
  };

  const loadSpecialties = async () => {
    try {
      const response = await fetch("/api/specialties", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al cargar el catálogo de especialidades");
      }

      setSpecialties(data.data);
    } catch (error) {
      toast.error("Error al cargar el catálogo de especialidades");
    }
  };

  const loadScopes = async (specialtyId: string) => {
    try {
      const response = await fetch(`/api/specialties/${specialtyId}/scopes`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al cargar los alcances");
      }

      setScopes(data.data);
      setFilters(prev => ({ ...prev, scopeId: "", subscopeId: "" }));
    } catch (error) {
      toast.error("Error al cargar los alcances");
    }
  };

  const loadSubscopes = async (scopeId: string) => {
    try {
      const response = await fetch(`/api/scopes/${scopeId}/subscopes`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al cargar los subalcances");
      }

      setSubscopes(data.data);
      setFilters(prev => ({ ...prev, subscopeId: "" }));
    } catch (error) {
      toast.error("Error al cargar los subalcances");
    }
  };

  useEffect(() => {
    if (filters.specialtyId) {
      loadScopes(filters.specialtyId);
      loadCompanies();
    } else {
      // Si se selecciona "Todas las especialidades"
      loadCompanies();
    }
  }, [filters.specialtyId]);

  useEffect(() => {
    if (filters.scopeId) {
      loadSubscopes(filters.scopeId);
      loadCompanies();
    }
  }, [filters.scopeId]);

  useEffect(() => {
    if (filters.subscopeId) {
      loadCompanies();
    }
  }, [filters.subscopeId]);

  useEffect(() => {
    loadCompanies();
  }, [filters.certificationIds]);

  useEffect(() => {
    // Si no hay filtros y no estamos editando, inicializar nuevo quote
    if (!filters.specialtyId && filters.certificationIds.length === 0 && !editingQuote?.id) {
      initNewQuote();
    }
  }, [filters]);

  const loadCompanies = async () => {
    try {
      // Si no hay filtros y estamos editando, cargar todas las empresas activas
      if (!filters.specialtyId && filters.certificationIds.length === 0) {
        const response = await fetch("/api/companies", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al cargar empresas");
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Error al cargar empresas");
        }

        setCompanies(data.data);
        return;
      }

      // Si hay filtros, usar el endpoint de filtrado
      const params = new URLSearchParams();
      if (filters.specialtyId) {
        params.append("specialtyId", filters.specialtyId);
      }
      if (filters.scopeId) {
        params.append("scopeId", filters.scopeId);
      }
      if (filters.subscopeId) {
        params.append("subscopeId", filters.subscopeId);
      }
      filters.certificationIds.forEach(id => {
        params.append("certificationIds[]", id);
      });

      const response = await fetch(`/api/companies/filter?${params}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar empresas");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Error al cargar empresas");
      }

      setCompanies(data.data);
    } catch (error) {
      console.error("Error cargando empresas:", error);
      toast.error("Error al cargar el listado de empresas");
    }
  };

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${project.id}/quotes`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar las cotizaciones");
      }

      const data = await response.json();
      setQuotes(data.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar las cotizaciones");
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (date: Date | null | undefined) => {
    if (!date) return "";
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) throw new Error("Invalid date");
      return d.toISOString().split("T")[0];
    } catch (error) {
      console.error("Error formatting date:", date, error);
      return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setSubmitting(true);

    try {
      const formData = new FormData(form);
      const formJson = {
        projectId: project.id,
        companyId: parseInt(formData.get("companyId") as string),
        deadline: new Date(formData.get("deadline") as string),
        itemDescription: formData.get("itemDescription") as string,
      };

      // Validar campos requeridos
      if (!formJson.companyId || !formJson.deadline || !formJson.itemDescription) {
        throw new Error("Todos los campos son requeridos");
      }
      
      const url = editingQuote?.id
        ? `/api/projects/${project.id}/quotes/${editingQuote.id}`
        : `/api/projects/${project.id}/quotes`;

      const method = editingQuote?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(formJson),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Error al ${editingQuote ? "actualizar" : "crear"} la cotización`);
      }

      await loadQuotes();
      toast.success(`Cotización ${editingQuote ? "actualizada" : "creada"} correctamente`);
      resetForm();
    } catch (error) {
      console.error("Error en submit:", error);
      toast.error(error instanceof Error ? error.message : `Error al ${editingQuote ? "actualizar" : "crear"} la cotización`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (quote: ProjectQuoteType) => {
    // Resetear filtros antes de cargar la cotización
    setFilters({
      specialtyId: "",
      scopeId: "",
      subscopeId: "",
      certificationIds: [],
    });
    
    setEditingQuote(quote);
  };

  // Resetear el formulario
  const resetForm = () => {
    setEditingQuote(null);
    setFilters({
      specialtyId: "",
      scopeId: "",
      subscopeId: "",
      certificationIds: [],
    });
  };

  // Inicializar un nuevo quote
  const initNewQuote = () => {
    setEditingQuote({
      projectId: project.id,
      companyId: undefined,
      company: undefined,
      deadline: undefined,
      itemDescription: "",
    });
  };

  // Limpiar campos dependientes
  const clearDependentFields = (field: 'specialty' | 'scope') => {
    if (field === 'specialty') {
      setFilters(prev => ({ 
        ...prev, 
        scopeId: "", 
        subscopeId: "" 
      }));
      setScopes([]);
      setSubscopes([]);
    } else if (field === 'scope') {
      setFilters(prev => ({ 
        ...prev, 
        subscopeId: "" 
      }));
      setSubscopes([]);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Cotizaciones - {project.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtros */}
          <div className="space-y-4 border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Especialidades</Label>
                <Select
                  value={filters.specialtyId || "all"}
                  onValueChange={(value) => {
                    setFilters(prev => ({
                      ...prev,
                      specialtyId: value === "all" ? "" : value,
                      scopeId: "",
                      subscopeId: "",
                    }));
                    setScopes([]);
                    setSubscopes([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las especialidades</SelectItem>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty.id} value={specialty.id.toString()}>
                        {specialty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Alcances</Label>
                <Select
                  value={filters.scopeId}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, scopeId: value }))}
                  disabled={!filters.specialtyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un alcance" />
                  </SelectTrigger>
                  <SelectContent>
                    {scopes.map((scope) => (
                      <SelectItem key={scope.id} value={scope.id.toString()}>
                        {scope.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subalcances</Label>
                <Select
                  value={filters.subscopeId}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, subscopeId: value }))}
                  disabled={!filters.scopeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un subalcance" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscopes.map((subscope) => (
                      <SelectItem key={subscope.id} value={subscope.id.toString()}>
                        {subscope.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Certificaciones requeridas</Label>
              <Select
                value={filters.certificationIds[0] || ""}
                onValueChange={(value) => {
                  const newCertIds = filters.certificationIds.includes(value)
                    ? filters.certificationIds.filter(id => id !== value)
                    : [...filters.certificationIds, value];
                  setFilters(prev => ({ ...prev, certificationIds: newCertIds }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona certificaciones">
                    {filters.certificationIds.length > 0
                      ? `${filters.certificationIds.length} certificaciones seleccionadas`
                      : "Selecciona certificaciones"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {certifications.map((cert) => (
                    <SelectItem
                      key={cert.id}
                      value={cert.id.toString()}
                      className="flex items-center space-x-2"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={filters.certificationIds.includes(cert.id.toString())}
                          className="mr-2"
                        />
                        <span>{cert.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filters.certificationIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.certificationIds.map(id => {
                    const cert = certifications.find(c => c.id.toString() === id);
                    return cert ? (
                      <div
                        key={id}
                        className="flex items-center gap-2 bg-secondary px-2 py-1 rounded-md text-sm"
                      >
                        <span>{cert.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => {
                            setFilters(prev => ({
                              ...prev,
                              certificationIds: prev.certificationIds.filter(cid => cid !== id)
                            }));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="projectId" value={project.id} />

            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select
                name="companyId"
                value={editingQuote?.companyId?.toString() || ""}
                onValueChange={(value) => {
                  if (editingQuote) {
                    const selectedCompany = companies.find(c => c.id === parseInt(value));
                    if (selectedCompany) {
                      setEditingQuote({
                        ...editingQuote,
                        companyId: parseInt(value),
                        company: selectedCompany
                      });
                    }
                  } else {
                    const selectedCompany = companies.find(c => c.id === parseInt(value));
                    if (selectedCompany) {
                      setEditingQuote({
                        companyId: parseInt(value),
                        company: selectedCompany
                      });
                    }
                  }
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem 
                      key={company.id} 
                      value={company.id.toString()}
                    >
                      {company.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha límite</Label>
              <Input
                type="date"
                name="deadline"
                value={editingQuote ? formatDateForInput(editingQuote.deadline) : ""}
                onChange={(e) => {
                  if (editingQuote) {
                    setEditingQuote({
                      ...editingQuote,
                      deadline: new Date(e.target.value)
                    });
                  } else {
                    setEditingQuote({
                      deadline: new Date(e.target.value)
                    });
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                name="itemDescription"
                value={editingQuote?.itemDescription || ""}
                onChange={(e) => {
                  if (editingQuote) {
                    setEditingQuote({
                      ...editingQuote,
                      itemDescription: e.target.value
                    });
                  } else {
                    setEditingQuote({
                      itemDescription: e.target.value
                    });
                  }
                }}
                placeholder="Descripción de la cotización"
              />
            </div>

            <div className="flex justify-end gap-2">
              {editingQuote?.id && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingQuote(null)}
                >
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando..." : editingQuote?.id ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>

          {/* Tabla */}
          <ProjectQuotesTable
            quotes={quotes}
            loading={loading}
            onReload={loadQuotes}
            projectId={project.id}
            onEdit={handleEdit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
