"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { FileText, Loader2, Trash2, Pencil } from "lucide-react";

interface CertificatesModalProps {
  open: boolean;
  onClose: () => void;
  companyId: number;
  companyName: string;
  comercialName?: string;
  onSuccess?: () => void;
}

type Certification = {
  id: number;
  name: string;
  description?: string;
};

type CompanyCertificate = {
  id: number;
  certification: Certification;
  certificateFileName: string | null;
  expirationDate: Date | null;
  isCommitment: boolean;
  commitmentDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function CertificatesModal({
  open,
  onClose,
  companyId,
  companyName,
  comercialName,
  onSuccess,
}: CertificatesModalProps) {
  const [certificates, setCertificates] = useState<CompanyCertificate[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [certificateToDelete, setCertificateToDelete] =
    useState<CompanyCertificate | null>(null);
  const [editingCertificate, setEditingCertificate] =
    useState<CompanyCertificate | null>(null);
  const [newCertificate, setNewCertificate] = useState({
    certificationId: "",
    certificateFile: null as File | null,
    expirationDate: "",
    isCommitment: false,
    commitmentDate: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar el catálogo de certificaciones
  const loadCertifications = async () => {
    try {
      const response = await fetch("/api/certifications", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar el catálogo de certificaciones");
      }

      const data = await response.json();
      setCertifications(data.items || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar el catálogo de certificaciones");
    }
  };

  // Cargar certificados de la empresa
  const loadCertificates = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setLoading(true);
      }
      const response = await fetch(`/api/companies/${companyId}/certificates`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los certificados");
      }

      const data = await response.json();

      setCertificates(data.data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar los certificados");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCertificate = async () => {
    try {
      if (!newCertificate.certificationId) {
        toast.error("Selecciona una certificación");
        return;
      }

      if (newCertificate.isCommitment) {
        if (!newCertificate.commitmentDate) {
          toast.error("La fecha de compromiso es requerida");
          return;
        }
      } else {
        if (!newCertificate.expirationDate) {
          toast.error("La fecha de vencimiento es requerida");
          return;
        }

        if (!editingCertificate && !newCertificate.certificateFile) {
          toast.error("El archivo del certificado es requerido");
          return;
        }
      }

      setSubmitting(true);

      const formData = new FormData();
      formData.append("certificationId", newCertificate.certificationId);
      formData.append("isCommitment", newCertificate.isCommitment.toString());

      // Ajustar las fechas a UTC antes de enviar
      if (newCertificate.isCommitment && newCertificate.commitmentDate) {
        formData.append("commitmentDate", newCertificate.commitmentDate);
      } else if (
        !newCertificate.isCommitment &&
        newCertificate.expirationDate
      ) {
        formData.append("expirationDate", newCertificate.expirationDate);
      }

      if (!newCertificate.isCommitment && newCertificate.certificateFile) {
        formData.append("certificateFile", newCertificate.certificateFile);
      }

      const response = await fetch(
        `/api/companies/${companyId}/certificates${editingCertificate ? `/${editingCertificate.id}` : ""}`,
        {
          method: editingCertificate ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Verificar si el error es por certificación duplicada
        if (data.error && data.error.includes("Ya existe un certificado activo")) {
          toast.warning("Esta certificación ya existe para esta empresa");
        } else {
          toast.error(data.error || "Error al agregar el certificado");
        }
        setSubmitting(false);
        return;
      }

      if (!data.success) {
        // Verificar si el error es por certificación duplicada
        if (data.error && data.error.includes("Ya existe un certificado activo")) {
          toast.warning("Esta certificación ya existe para esta empresa");
        } else {
          toast.error(data.error || "Error al agregar el certificado");
        }
        setSubmitting(false);
        return;
      }

      toast.success(
        editingCertificate
          ? "Certificado actualizado correctamente"
          : "Certificado agregado correctamente"
      );

      // Limpiar completamente el estado
      resetForm();

      // Recargar la lista de certificados
      loadCertificates();

      // Llamar al callback de éxito
      onSuccess?.();
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al agregar el certificado"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (certificateId: number) => {
    try {
      const response = await fetch(
        `/api/certificates/${certificateId}/download`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al descargar el certificado");
      }

      // Obtener el nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get("Content-Disposition");
      const fileName = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : "certificado.pdf";

      // Crear blob y descargar
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al descargar el certificado");
    }
  };

  const handleDeleteCertificate = async (certificate: CompanyCertificate) => {
    try {
      // Actualizar el estado local inmediatamente
      setCertificates((prev) =>
        prev.filter((cert) => cert.id !== certificate.id)
      );

      const response = await fetch(
        `/api/companies/${companyId}/certificates/${certificate.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        // Si hay error, revertir el cambio local
        loadCertificates();
        throw new Error("Error al eliminar el certificado");
      }

      toast.success("Certificado eliminado correctamente");

      // Llamar al callback de éxito
      onSuccess?.();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar el certificado");
    }
  };

  const handleEditCertificate = (cert: CompanyCertificate) => {
    setEditingCertificate(cert);

    // Función auxiliar para formatear fecha para input type="date"
    const formatDateForInput = (date: Date | null) => {
      if (!date) return "";
      return new Date(date).toISOString().split("T")[0];
    };

    setNewCertificate({
      certificationId: cert.certification.id.toString(),
      certificateFile: null,
      expirationDate: formatDateForInput(cert.expirationDate),
      isCommitment: cert.isCommitment,
      commitmentDate: formatDateForInput(cert.commitmentDate),
    });
  };

  const handleCancelEdit = () => {
    setEditingCertificate(null);
    setNewCertificate({
      certificationId: "",
      certificateFile: null,
      expirationDate: "",
      isCommitment: false,
      commitmentDate: "",
    });
    // Limpiar el input de archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setEditingCertificate(null);
    setNewCertificate({
      certificationId: "",
      certificateFile: null,
      expirationDate: "",
      isCommitment: false,
      commitmentDate: "",
    });
    // Limpiar el input de archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Limpiar estado cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      handleCancelEdit();
    }
  }, [open]);

  // Función para formatear fecha para mostrar en la tabla
  const formatDateForDisplay = (date: string | Date | null) => {
    if (!date) return "N/A";
    try {
      // Si la fecha ya es un objeto Date, usarlo directamente
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) throw new Error("Invalid date");

      return d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC", // Forzar interpretación UTC
      });
    } catch (error) {
      console.error("Error formatting date:", date, error);
      return "Fecha inválida";
    }
  };

  useEffect(() => {
    if (open) {
      loadCertifications();
      loadCertificates();
    }
  }, [open]);

  // Función para verificar si un certificado está vencido
  const isCertificateExpired = (cert: CompanyCertificate) => {
    const today = new Date();
    if (cert.isCommitment && cert.commitmentDate) {
      return new Date(cert.commitmentDate) < today;
    } else if (!cert.isCommitment && cert.expirationDate) {
      return new Date(cert.expirationDate) < today;
    }
    return false;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader className="mb-4">
            <DialogTitle>
              <span className="text-muted-foreground">Certificados de </span>
              <span className="text-blue-500 dark:text-blue-400 font-bold">
                {comercialName || companyName}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Formulario para agregar certificado */}
            <div className="space-y-4">
              {/* Primera fila: Certificación */}
              <div className="space-y-2">
                <Label>Certificación</Label>
                <Select
                  value={newCertificate.certificationId}
                  onValueChange={(value) =>
                    setNewCertificate((prev) => ({
                      ...prev,
                      certificationId: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una certificación" />
                  </SelectTrigger>
                  <SelectContent>
                    {certifications.map((cert) => (
                      <SelectItem key={cert.id} value={cert.id.toString()}>
                        {cert.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Segunda fila: Checkbox de compromiso */}
              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="isCommitment"
                  checked={newCertificate.isCommitment}
                  onCheckedChange={(checked) =>
                    setNewCertificate((prev) => ({
                      ...prev,
                      isCommitment: checked === true,
                      // Limpiar campos no relevantes según el tipo
                      certificateFile:
                        checked === true ? null : prev.certificateFile,
                      expirationDate:
                        checked === true ? "" : prev.expirationDate,
                      commitmentDate:
                        checked === true ? prev.commitmentDate : "",
                    }))
                  }
                />
                <label
                  htmlFor="isCommitment"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Es un compromiso de certificación
                </label>
              </div>

              {/* Tercera fila: Campos condicionales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-4 bg-muted/30">
                {newCertificate.isCommitment ? (
                  /* Si es compromiso */
                  <div className="space-y-2">
                    <Label>Fecha de Compromiso</Label>
                    <Input
                      type="date"
                      value={newCertificate.commitmentDate}
                      onChange={(e) =>
                        setNewCertificate((prev) => ({
                          ...prev,
                          commitmentDate: e.target.value,
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                ) : (
                  /* Si no es compromiso */
                  <>
                    <div className="space-y-2">
                      <Label>Fecha de Vencimiento</Label>
                      <Input
                        type="date"
                        value={newCertificate.expirationDate}
                        onChange={(e) =>
                          setNewCertificate((prev) => ({
                            ...prev,
                            expirationDate: e.target.value,
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Archivo de Certificado</Label>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) =>
                            setNewCertificate((prev) => ({
                              ...prev,
                              certificateFile: e.target.files?.[0] || null,
                            }))
                          }
                          className="w-full"
                        />
                        {editingCertificate?.certificateFileName &&
                          !newCertificate.certificateFile && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>
                                Archivo actual:{" "}
                                {editingCertificate.certificateFileName}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Botón de agregar */}
              <div className="flex justify-end gap-2">
                {editingCertificate && (
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    type="button"
                  >
                    Cancelar
                  </Button>
                )}
                <Button onClick={handleAddCertificate} disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingCertificate ? (
                    "Guardar"
                  ) : (
                    "Agregar"
                  )}
                </Button>
              </div>
            </div>

            {/* Tabla de certificados */}
            <div className="rounded-md border mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">
                        Certificación
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Archivo
                      </TableHead>
                      <TableHead className="whitespace-nowrap">Vence</TableHead>
                      <TableHead className="whitespace-nowrap">
                        Compromiso
                      </TableHead>
                      <TableHead className="w-20 text-center whitespace-nowrap">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </TableCell>
                      </TableRow>
                    ) : certificates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No hay certificados registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      certificates.map((cert) => (
                        <TableRow key={cert.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium whitespace-nowrap">
                            {cert.certification.name}
                          </TableCell>
                          <TableCell>
                            {cert.certificateFileName && (
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <button
                                  onClick={(e) => handleDownload(cert.id)}
                                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[200px]"
                                >
                                  {cert.certificateFileName}
                                </button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDateForDisplay(cert.expirationDate)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDateForDisplay(cert.commitmentDate)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditCertificate(cert)}
                                className="mx-auto"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCertificate(cert)}
                                className="mx-auto"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!certificateToDelete}
        onOpenChange={() => setCertificateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el certificado &quot;
              {certificateToDelete?.certification.name}&quot; y no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteCertificate(certificateToDelete!)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
