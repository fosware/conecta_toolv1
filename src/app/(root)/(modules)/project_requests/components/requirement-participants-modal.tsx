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
  ndaFile?: string | null;
  ndaFileName?: string | null;
  hasSignedNDA?: boolean;
  ndaSignedFileName?: string | null;
  statusId?: number | null;
  participantId?: number | null;
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
  const [ndaFiles, setNdaFiles] = useState<Record<number, File | null>>({});
  const [showOnlyMatching, setShowOnlyMatching] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Interfaz para el objeto de eliminación de NDA
  interface CompanyToDeleteNDA {
    id: number;
    companyId: number;
    hasSignedNDA: boolean;
    isSignedNDA?: boolean; // Indica si estamos eliminando el NDA firmado
  }

  const [companyToDeleteNDA, setCompanyToDeleteNDA] = useState<CompanyToDeleteNDA | null>(null);
  const [deletingNDA, setDeletingNDA] = useState(false);

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
        projectRequestId: requirement?.projectRequestId 
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

      // Guardar los totales de especialidades y certificaciones requeridas
      setTotalSpecialties(data.totalSpecialties || 0);
      setTotalCertifications(data.totalCertifications || 0);
      
      // Transformar los datos y marcar las empresas ya seleccionadas
      const companiesWithSelection = data.companies.map((company: any) => ({
        ...company,
        isSelected: company.isParticipant || false,
      }));

      setEligibleCompanies(companiesWithSelection);

      // Inicializar el array de empresas seleccionadas
      const initialSelectedCompanies = companiesWithSelection
        .filter((company: CompanyWithMatch) => company.isSelected)
        .map((company: CompanyWithMatch) => company.id);

      setSelectedCompanies(initialSelectedCompanies);
    } catch (error) {
      console.error("Error al cargar empresas elegibles:", error);
      toast.error("Error al cargar empresas elegibles");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar empresas según el término de búsqueda y el switch de coincidencias
  const filteredCompanies = eligibleCompanies.filter((company) => {
    // Filtro por texto de búsqueda
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase().trim();
      if (!company.comercialName.toLowerCase().includes(searchTermLower)) {
        return false;
      }
    }

    // Filtro por coincidencias si está activado
    if (showOnlyMatching) {
      // Si hay especialidades definidas, verificar si la empresa cumple
      const matchesSpecialties = totalSpecialties > 0 ? company.matchingSpecialties > 0 : true;
      
      // Si hay certificaciones definidas, verificar si la empresa cumple
      const matchesCertifications = totalCertifications > 0 ? company.matchingCertifications > 0 : true;
      
      // Mostrar empresas que cumplen con los requisitos definidos
      // Si hay ambos requisitos, debe cumplir ambos
      // Si solo hay un tipo de requisito, debe cumplir ese tipo
      if (totalSpecialties > 0 && totalCertifications > 0) {
        return matchesSpecialties && matchesCertifications;
      } else if (totalSpecialties > 0) {
        return matchesSpecialties;
      } else if (totalCertifications > 0) {
        return matchesCertifications;
      } else {
        // Si no hay requisitos definidos, mostrar todas las empresas
        return true;
      }
    }

    return true;
  });

  // Manejar la selección de una empresa
  const handleCompanySelection = (companyId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCompanies((prev) => [...prev, companyId]);
    } else {
      setSelectedCompanies((prev) => prev.filter((id) => id !== companyId));
    }
  };

  // Manejar la carga de archivos NDA
  const handleNdaFileChange = (companyId: number, file: File | null) => {
    setNdaFiles((prev) => ({
      ...prev,
      [companyId]: file,
    }));
  };

  // Función para mostrar el diálogo de confirmación para eliminar NDA
  const handleDeleteNDAConfirm = (companyId: number, isSignedNDA: boolean = false) => {
    const company = eligibleCompanies.find((c) => c.id === companyId);
    if (!company) return;

    if (!company.participantId) {
      toast.error("No se pudo identificar el registro del participante");
      return;
    }

    setCompanyToDeleteNDA({
      id: company.participantId,
      companyId: companyId,
      hasSignedNDA: !!company.ndaSignedFileName,
      isSignedNDA: isSignedNDA // Indica si estamos eliminando el NDA firmado
    });
    setDeleteDialogOpen(true);
  };

  // Función para eliminar un NDA
  const handleDeleteNDA = async () => {
    if (!companyToDeleteNDA || !requirement?.id) return;

    try {
      setDeletingNDA(true);

      // Determinar qué tipo de NDA eliminar (original o firmado)
      // Si isSignedNDA es true, significa que estamos eliminando el NDA firmado
      // Si isSignedNDA es false o undefined, significa que estamos eliminando el NDA original
      const isSignedNDA = companyToDeleteNDA.isSignedNDA === true;
      
      // Si estamos eliminando el NDA firmado, usar el endpoint nda_signed
      // Si estamos eliminando el NDA original, usar el endpoint nda (que eliminará también el firmado si existe)
      const endpoint = isSignedNDA
        ? `/api/project_requests/${requirement.projectRequestId}/requirements/${requirement.id}/participants/${companyToDeleteNDA.id}/nda_signed`
        : `/api/project_requests/${requirement.projectRequestId}/requirements/${requirement.id}/participants/${companyToDeleteNDA.id}/nda`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el NDA");
      }

      // Mostrar toast de éxito
      toast.success("NDA eliminado correctamente");
      loadEligibleCompanies(false);
      
      // Llamar al callback de éxito si existe
      if (onSuccess) {
        // Llamamos a onSuccess sin mostrar toast adicional
        onSuccess();
      }
    } catch (error) {
      console.error("Error al eliminar NDA:", error);
      toast.error("Error al eliminar el NDA");
    } finally {
      setDeletingNDA(false);
      setDeleteDialogOpen(false);
      setCompanyToDeleteNDA(null);
    }
  };

  // Guardar los cambios en las empresas participantes
  const handleSaveParticipants = async () => {
    if (!requirement?.id) return;

    try {
      setSaving(true);

      // Preparar los datos para enviar
      const formData = new FormData();

      // Agregar las empresas seleccionadas
      formData.append("selectedCompanies", JSON.stringify(selectedCompanies));

      // Agregar los archivos NDA si existen
      Object.entries(ndaFiles).forEach(([companyId, file]) => {
        if (file) {
          formData.append(`nda_${companyId}`, file);
        }
      });

      // Enviar los datos al servidor
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
        throw new Error("Error al guardar los participantes");
      }

      // Mostrar toast de éxito
      toast.success("Participantes guardados correctamente");

      // Recargar los datos
      loadEligibleCompanies(false);

      // Llamar al callback de éxito si existe
      if (onSuccess) {
        // Llamamos a onSuccess sin mostrar toast adicional
        onSuccess();
      }
    } catch (error) {
      console.error("Error al guardar participantes:", error);
      toast.error("Error al guardar los participantes");
    } finally {
      setSaving(false);
    }
  };

  // Descargar un archivo NDA
  const handleDownloadNDA = async (companyId: number, isSigned: boolean) => {
    if (!requirement?.id) return;

    try {
      const company = eligibleCompanies.find((c) => c.id === companyId);
      if (!company || !company.participantId) {
        toast.error("No se pudo identificar el registro del participante");
        return;
      }

      const endpoint = isSigned
        ? `/api/project_requests/${requirement.projectRequestId}/requirements/${requirement.id}/participants/${company.participantId}/nda_signed/download`
        : `/api/project_requests/${requirement.projectRequestId}/requirements/${requirement.id}/participants/${company.participantId}/nda/download`;

      // Abrir en una nueva pestaña para descargar
      window.open(endpoint, "_blank");
    } catch (error) {
      console.error("Error al descargar NDA:", error);
      toast.error("Error al descargar el archivo");
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
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-medium">
                  Requerimiento: {requirement.requirementName}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-matching"
                    checked={showOnlyMatching}
                    onCheckedChange={setShowOnlyMatching}
                  />
                  <Label htmlFor="show-matching">
                    Mostrar solo asociados que cumplen requisitos
                  </Label>
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
                        <TableHead className="text-center">
                          NDA Original
                        </TableHead>
                        <TableHead className="text-center">
                          NDA Firmado
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
                                {totalSpecialties > 0 ? company.matchingSpecialties : "N/A"}
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
                                {totalCertifications > 0 ? company.matchingCertifications : "N/A"}
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
                          {/* NDA Original */}
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              {company.ndaFileName ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() =>
                                      handleDownloadNDA(company.id, false)
                                    }
                                  >
                                    <FileText className="mr-1 h-3 w-3" />
                                    Ver NDA
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-red-500 hover:text-red-600"
                                    onClick={() =>
                                      handleDeleteNDAConfirm(company.id, false)
                                    }
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : selectedCompanies.includes(company.id) ? (
                                <div>
                                  <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null;
                                      handleNdaFileChange(company.id, file);
                                    }}
                                    className="text-xs"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Subir NDA (PDF)
                                  </p>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Seleccione la empresa para subir NDA
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* NDA Firmado */}
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              {company.ndaSignedFileName ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() =>
                                      handleDownloadNDA(company.id, true)
                                    }
                                  >
                                    <FileText className="mr-1 h-3 w-3" />
                                    Ver NDA Firmado
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-red-500 hover:text-red-600"
                                    onClick={() =>
                                      handleDeleteNDAConfirm(company.id, true)
                                    }
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {company.ndaFileName ? 
                                    "El NDA firmado se gestiona en otro módulo" : 
                                    "Primero suba el NDA original"}
                                </span>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar NDA?</AlertDialogTitle>
            <AlertDialogDescription>
              {companyToDeleteNDA?.isSignedNDA
                ? "¿Está seguro de que desea eliminar el archivo NDA firmado?"
                : companyToDeleteNDA?.hasSignedNDA
                  ? "ADVERTENCIA: Al eliminar este archivo NDA, también se eliminará el archivo NDA firmado asociado. ¿Desea continuar?"
                  : "¿Está seguro de que desea eliminar este archivo NDA?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNDA} disabled={deletingNDA}>
              {deletingNDA ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
