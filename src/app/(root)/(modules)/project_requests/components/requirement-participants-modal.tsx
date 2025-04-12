"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Company } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Loader2,
  Building2,
  FileText,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react";
import { getToken } from "@/lib/auth";

interface ProjectRequirement {
  id?: number;
  requirementName: string;
  projectRequestId: number;
  isActive?: boolean;
  isDeleted?: boolean;
}

interface CompanyWithMatch {
  id: number;
  comercialName: string;
  contactName: string;
  email: string;
  phone: string;
  isSelected: boolean;
  matchingSpecialties: number;
  matchingCertifications: number;
  hasNDA: boolean;
  ndaFileName?: string | null;
  ndaExpirationDate?: string | null;
  ndaId?: number | null;
  participantId?: number | null;
  statusId?: number | null;
}

interface RequirementParticipantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement: ProjectRequirement | null;
  onSuccess?: () => void;
}

export function RequirementParticipantsModal({
  open,
  onOpenChange,
  requirement,
  onSuccess,
}: RequirementParticipantsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [eligibleCompanies, setEligibleCompanies] = useState<
    CompanyWithMatch[]
  >([]);
  const [totalSpecialties, setTotalSpecialties] = useState(0);
  const [totalCertifications, setTotalCertifications] = useState(0);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [filterType, setFilterType] = useState<
    "all" | "both" | "specialties" | "certifications" | "none"
  >("both");
  const [companyToDeselect, setCompanyToDeselect] = useState<number | null>(null);
  const [deselectDialogOpen, setDeselectDialogOpen] = useState(false);
  const [deselecting, setDeselecting] = useState(false);

  // Cargar empresas elegibles cuando se abre el modal
  useEffect(() => {
    if (open && requirement?.id) {
      loadEligibleCompanies(true);
    }
  }, [open, requirement]);

  // Cargar empresas que cumplen con los requisitos
  const loadEligibleCompanies = async (showLoading = true) => {
    if (!requirement?.id || !requirement?.projectRequestId) {
      console.error("Error: ID de requerimiento o proyecto no disponible", {
        requirementId: requirement?.id,
        projectRequestId: requirement?.projectRequestId,
      });
      toast.error("No se pueden cargar las empresas elegibles");
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }

      // Obtener las empresas elegibles para este requerimiento específico
      const response = await fetch(
        `/api/project_requests/${requirement.projectRequestId}/requirements/${requirement.id}/eligible_companies`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar empresas elegibles");
      }

      const data = await response.json();
      
      // Obtener los participantes actuales
      const participantsResponse = await fetch(
        `/api/project_requests/${requirement.projectRequestId}/requirements/${requirement.id}/participants`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!participantsResponse.ok) {
        throw new Error("Error al cargar participantes");
      }

      const participantsData = await participantsResponse.json();
      
      // Obtener información de NDAs para todas las empresas
      const ndasResponse = await fetch(
        `/api/project_requests/${requirement.projectRequestId}/requirements/${requirement.id}/check_ndas`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!ndasResponse.ok) {
        throw new Error("Error al verificar NDAs");
      }

      const ndasData = await ndasResponse.json();
      
      // Obtener el cliente asociado a esta solicitud de proyecto
      const projectResponse = await fetch(
        `/api/project_requests/${requirement.projectRequestId}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      
      if (!projectResponse.ok) {
        throw new Error("Error al cargar información del proyecto");
      }
      
      const projectData = await projectResponse.json();
      
      // Verificar la estructura de la respuesta y obtener el clientId
      let clientId;
      if (projectData.project) {
        clientId = projectData.project.clientArea.client.id;
      } else if (projectData.clientAreaId) {
        // Obtener el área del cliente
        const clientAreaResponse = await fetch(
          `/api/client_areas/${projectData.clientAreaId}`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );
        
        if (!clientAreaResponse.ok) {
          throw new Error("Error al cargar información del área del cliente");
        }
        
        const clientAreaData = await clientAreaResponse.json();
        clientId = clientAreaData.clientId;
      } else {
        // Si no podemos obtener el clientId, continuamos sin filtrar por NDA
        console.warn("No se pudo obtener el ID del cliente, no se verificarán NDAs");
        clientId = null;
      }
      
      // Combinar los datos
      const companies = data.companies.map((company: any) => {
        const participant = participantsData.participants.find(
          (p: any) => p.company.id === company.id
        );
        
        // Verificar si existe un NDA válido entre el cliente y la empresa
        const nda = ndasData.ndaResults.find((n: any) => n.companyId === company.id);
        const hasNDA = nda?.hasNDA || false;
        
        return {
          ...company,
          isSelected: !!participant,
          hasNDA: hasNDA,
          ndaFileName: nda?.ndaFileName || null,
          ndaExpirationDate: nda?.ndaExpirationDate || null,
          ndaId: nda?.ndaId || null,
          participantId: participant?.id || null,
          statusId: participant?.statusId || null,
        };
      });

      setEligibleCompanies(companies);
      setTotalSpecialties(data.totalSpecialties || 0);
      setTotalCertifications(data.totalCertifications || 0);
      
      // Actualizar la lista de empresas seleccionadas
      setSelectedCompanies(
        companies
          .filter((company: CompanyWithMatch) => company.isSelected)
          .map((company: CompanyWithMatch) => company.id)
      );
    } catch (error) {
      console.error("Error al cargar empresas elegibles:", error);
      toast.error("Error al cargar empresas elegibles");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Filtrar empresas según el término de búsqueda y el tipo de filtro seleccionado
  const filteredCompanies = eligibleCompanies.filter((company) => {
    // Filtro por texto de búsqueda
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase().trim();
      if (!company.comercialName.toLowerCase().includes(searchTermLower)) {
        return false;
      }
    }

    // Verificar si cumple con especialidades
    const matchesSpecialties =
      totalSpecialties > 0 ? company.matchingSpecialties > 0 : true;

    // Verificar si cumple con certificaciones
    const matchesCertifications =
      totalCertifications > 0 ? company.matchingCertifications > 0 : true;

    // Aplicar filtro según el tipo seleccionado
    switch (filterType) {
      case "all": // Mostrar todas las empresas
        return true;
      case "both": // Cumplen con ambos requisitos
        return matchesSpecialties && matchesCertifications;
      case "specialties": // Solo cumplen con especialidades
        return (
          matchesSpecialties &&
          (totalCertifications === 0 || !matchesCertifications)
        );
      case "certifications": // Solo cumplen con certificaciones
        return (
          matchesCertifications &&
          (totalSpecialties === 0 || !matchesSpecialties)
        );
      case "none": // No cumplen con ninguno
        return (
          (!matchesSpecialties || totalSpecialties === 0) &&
          (!matchesCertifications || totalCertifications === 0)
        );
      default:
        return true;
    }
  });

  // Manejar la selección de una empresa
  const handleCompanySelection = (companyId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCompanies((prev) => [...prev, companyId]);
    } else {
      setSelectedCompanies((prev) => prev.filter((id) => id !== companyId));
    }
  };

  // Guardar los cambios en las empresas participantes
  const handleSaveParticipants = async () => {
    if (!requirement?.id || !requirement?.projectRequestId) {
      toast.error("No se puede guardar: información de requerimiento incompleta");
      return;
    }

    try {
      setSaving(true);

      // Crear FormData para enviar los datos
      const formData = new FormData();
      formData.append("selectedCompanies", JSON.stringify(selectedCompanies));

      // Enviar la solicitud
      const response = await fetch(
        `/api/project_requests/${requirement.projectRequestId}/requirements/${requirement.id}/participants`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar participantes");
      }

      toast.success("Participantes guardados correctamente");
      
      // Recargar los datos
      await loadEligibleCompanies(false);
      
      // Notificar al componente padre si es necesario
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error al guardar participantes:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al guardar participantes"
      );
    } finally {
      setSaving(false);
    }
  };

  // Descargar el NDA de una empresa
  const handleDownloadNDA = async (ndaId: number) => {
    try {
      const response = await fetch(`/api/nda/${ndaId}/download`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al descargar el NDA");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nda.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar el NDA:", error);
      toast.error("Error al descargar el NDA");
    }
  };

  // Cerrar el modal
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar Asociados Participantes</DialogTitle>
          </DialogHeader>

          {requirement ? (
            <>
              <div className="space-y-4 mb-4">
                <div className="text-lg font-medium">
                  Requerimiento: {requirement.requirementName}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label className="text-sm font-medium">Filtrar por:</Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={filterType === "both" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType("both")}
                      className="text-xs h-8"
                    >
                      Cumplen ambos
                    </Button>
                    <Button
                      variant={
                        filterType === "specialties" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setFilterType("specialties")}
                      className="text-xs h-8"
                    >
                      Solo especialidades
                    </Button>
                    <Button
                      variant={
                        filterType === "certifications" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setFilterType("certifications")}
                      className="text-xs h-8"
                    >
                      Solo certificaciones
                    </Button>
                    <Button
                      variant={filterType === "none" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType("none")}
                      className="text-xs h-8"
                    >
                      No cumplen
                    </Button>
                    <Button
                      variant={filterType === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType("all")}
                      className="text-xs h-8"
                    >
                      Todos
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar asociados..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron empresas que cumplan con los criterios.
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Seleccionar</TableHead>
                        <TableHead>Asociado</TableHead>
                        <TableHead className="text-center">
                          Especialidades
                        </TableHead>
                        <TableHead className="text-center">
                          Certificaciones
                        </TableHead>
                        <TableHead className="w-[150px] text-center">
                          NDA
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompanies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="text-center">
                            <div className="flex justify-center items-center">
                              <Checkbox
                                checked={selectedCompanies.includes(company.id)}
                                onCheckedChange={(checked) =>
                                  handleCompanySelection(
                                    company.id,
                                    checked === true
                                  )
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {company.comercialName}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center items-center">
                              <span className="font-medium">
                                {totalSpecialties > 0
                                  ? company.matchingSpecialties
                                  : "N/A"}
                              </span>
                              {totalSpecialties > 0 ? (
                                company.matchingSpecialties > 0 ? (
                                  <CheckCircle2 className="ml-1 h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="ml-1 h-4 w-4 text-red-500" />
                                )
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center items-center">
                              <span className="font-medium">
                                {totalCertifications > 0
                                  ? company.matchingCertifications
                                  : "N/A"}
                              </span>
                              {totalCertifications > 0 ? (
                                company.matchingCertifications > 0 ? (
                                  <CheckCircle2 className="ml-1 h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="ml-1 h-4 w-4 text-red-500" />
                                )
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col justify-center items-center gap-1">
                              {company.hasNDA ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-3 py-2 text-xs flex items-center gap-1 hover:bg-gray-100 rounded no-underline cursor-pointer"
                                  onClick={() => handleDownloadNDA(company.ndaId!)}
                                  title={company.ndaExpirationDate ? `Expira: ${new Date(company.ndaExpirationDate).toLocaleDateString()}` : ""}
                                >
                                  <FileText className="h-4 w-4 text-green-500" />
                                  <span className="text-xs font-medium text-green-600 no-underline">Válido</span>
                                </Button>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span className="text-xs font-medium text-red-600">Sin NDA</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveParticipants} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Seleccione un requerimiento para gestionar sus participantes.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deselectDialogOpen} onOpenChange={setDeselectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Deseleccionar empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea deseleccionar esta empresa?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeselectDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => setDeselectDialogOpen(false)}>
              Deseleccionar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
