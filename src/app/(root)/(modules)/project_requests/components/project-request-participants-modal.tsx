"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Company } from "@prisma/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
import { Search, Loader2, Building2, FileText, CheckCircle2, XCircle } from "lucide-react";
import { ProjectRequestWithRelations } from "@/lib/schemas/project_request";

interface ProjectRequestParticipantsModalProps {
  open: boolean;
  onClose: () => void;
  projectRequestId: number;
  projectRequestTitle: string;
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

export function ProjectRequestParticipantsModal({
  open,
  onClose,
  projectRequestId,
  projectRequestTitle,
}: ProjectRequestParticipantsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [eligibleCompanies, setEligibleCompanies] = useState<CompanyWithMatch[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [ndaFiles, setNdaFiles] = useState<Record<number, File | null>>({});
  const [showOnlyMatching, setShowOnlyMatching] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDeleteNDA, setCompanyToDeleteNDA] = useState<{id: number, companyId: number, hasSignedNDA: boolean} | null>(null);
  const [deletingNDA, setDeletingNDA] = useState(false);

  // Cargar empresas elegibles cuando se abre el modal
  useEffect(() => {
    if (open && projectRequestId) {
      loadEligibleCompanies(true);
    }
  }, [open, projectRequestId]);

  // Cargar empresas que cumplen con los requisitos
  const loadEligibleCompanies = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await fetch(`/api/project_requests/${projectRequestId}/eligible_companies`);
      
      if (!response.ok) {
        throw new Error("Error al cargar empresas elegibles");
      }
      
      const data = await response.json();
      
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
      return company.matchingSpecialties > 0 || company.matchingCertifications > 0;
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
  const handleDeleteNDAConfirm = (companyId: number) => {
    const company = eligibleCompanies.find(c => c.id === companyId);
    if (!company) return;

    if (!company.participantId) {
      toast.error("No se pudo identificar el registro del participante");
      return;
    }

    setCompanyToDeleteNDA({
      id: company.participantId,
      companyId,
      hasSignedNDA: company.hasSignedNDA || false
    });
    setDeleteDialogOpen(true);
  };

  // Función para eliminar el NDA
  const handleDeleteNDA = async () => {
    if (!companyToDeleteNDA) return;

    try {
      setDeletingNDA(true);
      const deleteSignedNDA = companyToDeleteNDA.hasSignedNDA;
      
      const response = await fetch(
        `/api/project_requests/nda/${companyToDeleteNDA.id}/delete?deleteSignedNDA=${deleteSignedNDA}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el archivo NDA");
      }

      toast.success("Archivo NDA eliminado correctamente");
      
      // Recargar los datos sin mostrar el indicador de carga completo
      await loadEligibleCompanies(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar el archivo NDA");
    } finally {
      setDeletingNDA(false);
      setDeleteDialogOpen(false);
      setCompanyToDeleteNDA(null);
    }
  };

  // Función para descargar archivos NDA
  const handleDownloadNDA = async (companyId: number) => {
    try {
      // Buscar la empresa en el array de empresas
      const company = eligibleCompanies.find(c => c.id === companyId);
      if (!company) return;

      // Buscar el registro de participante para obtener el ID del registro
      const response = await fetch(`/api/project_requests/${projectRequestId}/participant/${companyId}`);
      if (!response.ok) {
        throw new Error("Error al obtener información del participante");
      }

      const data = await response.json();
      if (!data.participant || !data.participant.id) {
        throw new Error("No se encontró el registro del participante");
      }

      // Descargar el archivo usando el ID del registro
      const downloadResponse = await fetch(`/api/project_requests/nda/${data.participant.id}/download`);
      if (!downloadResponse.ok) {
        throw new Error("Error al descargar el archivo NDA");
      }

      // Crear blob y descargar
      const blob = await downloadResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = company.ndaFileName || "nda.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al descargar el archivo NDA");
    }
  };

  // Guardar los cambios
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Preparar los datos para enviar
      const formData = new FormData();
      formData.append("projectRequestId", projectRequestId.toString());
      formData.append("selectedCompanies", JSON.stringify(selectedCompanies));
      
      // Añadir archivos NDA si existen
      Object.entries(ndaFiles).forEach(([companyId, file]) => {
        if (file) {
          formData.append(`nda_${companyId}`, file);
        }
      });
      
      const response = await fetch("/api/project_requests/participants", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Error al guardar los participantes");
      }
      
      toast.success("Participantes guardados correctamente");
      onClose();
    } catch (error) {
      console.error("Error al guardar participantes:", error);
      toast.error("Error al guardar los participantes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo NDA?</AlertDialogTitle>
            <AlertDialogDescription>
              {companyToDeleteNDA?.hasSignedNDA
                ? "ADVERTENCIA: Al eliminar este archivo NDA, también se eliminará el archivo NDA firmado asociado. ¿Desea continuar?"
                : "¿Está seguro de que desea eliminar este archivo NDA?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingNDA}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNDA}
              disabled={deletingNDA}
              className="bg-red-500 hover:bg-red-600"
            >
              {deletingNDA && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Gestionar Asociados Participantes
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Solicitud: {projectRequestTitle}
          </p>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="flex items-center justify-between w-full gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar asociados..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="only-matching"
                checked={showOnlyMatching}
                onCheckedChange={setShowOnlyMatching}
              />
              <Label htmlFor="only-matching">Sólo asociados que cumplen</Label>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">Seleccionar</TableHead>
                  <TableHead>Asociado</TableHead>
                  <TableHead className="text-center">Especialidades</TableHead>
                  <TableHead className="text-center">Certificaciones</TableHead>
                  <TableHead>NDA</TableHead>
                  <TableHead>NDA Firmado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No hay asociados elegibles disponibles.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center">
                          <Checkbox
                            checked={selectedCompanies.includes(company.id)}
                            onCheckedChange={(checked) => 
                              handleCompanySelection(company.id, checked === true)
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell>{company.comercialName}</TableCell>
                      <TableCell className="text-center">
                        {company.matchingSpecialties > 0 ? (
                          <div className="flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="ml-1 text-xs font-medium text-green-600">{company.matchingSpecialties}</span>
                          </div>
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {company.matchingCertifications > 0 ? (
                          <div className="flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="ml-1 text-xs font-medium text-green-600">{company.matchingCertifications}</span>
                          </div>
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell>
                        {selectedCompanies.includes(company.id) && (
                          <div className="flex flex-col space-y-2">
                            {company.hasNDA ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4 text-green-600" />
                                  {company.ndaFile ? (
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => handleDownloadNDA(company.id)}
                                        className="text-sm text-green-600 hover:text-green-800 hover:underline truncate max-w-[150px]"
                                      >
                                        {company.ndaFileName || "NDA cargado"}
                                      </button>
                                      <button
                                        onClick={() => handleDeleteNDAConfirm(company.id)}
                                        className="text-xs text-red-500 hover:text-red-700 hover:underline"
                                        title="Eliminar NDA"
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-green-600">NDA cargado</span>
                                  )}
                                </div>
                                {company.hasSignedNDA && (
                                  <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm text-blue-600">
                                      {company.ndaSignedFileName || "NDA firmado"}
                                    </span>
                                  </div>
                                )}
                                <div className="text-xs text-gray-500 italic">
                                  {company.statusId === 2 && "Asociado seleccionado"}
                                  {company.statusId === 3 && "En espera de firma NDA"}
                                  {company.statusId === 4 && "Firmado por Asociado"}
                                  {company.statusId === 5 && "Espera de Documentos Técnicos"}
                                  {company.statusId === 6 && "Documentos Técnicos Recibidos"}
                                  {company.statusId === 7 && "Propuesta Enviada"}
                                  {company.statusId === 8 && "Propuesta Aceptada"}
                                  {company.statusId === 9 && "Propuesta Rechazada"}
                                  {company.statusId === 10 && "Proyecto Iniciado"}
                                  {company.statusId === 11 && "Proyecto Finalizado"}
                                  {company.statusId === 12 && "Proyecto Cancelado"}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <Label htmlFor={`nda-${company.id}`} className="text-xs">
                                  Subir NDA
                                </Label>
                                <Input
                                  id={`nda-${company.id}`}
                                  type="file"
                                  accept=".pdf,.doc,.docx"
                                  className="text-xs"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    handleNdaFileChange(company.id, file);
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {selectedCompanies.includes(company.id) && company.hasSignedNDA && (
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-600 truncate max-w-[200px]">
                              {company.ndaSignedFileName || "NDA firmado"}
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="ml-auto"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  </>
  );
}
