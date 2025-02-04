"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { FileText, Loader2, Trash2 } from "lucide-react";

interface CertificatesModalProps {
  open: boolean;
  onClose: () => void;
  companyId: number;
  companyName: string;
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
  expirationDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

export function CertificatesModal({
  open,
  onClose,
  companyId,
  companyName,
}: CertificatesModalProps) {
  const [certificates, setCertificates] = useState<CompanyCertificate[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState<CompanyCertificate | null>(null);
  const [newCertificate, setNewCertificate] = useState({
    certificationId: "",
    certificateFile: null as File | null,
    expirationDate: "",
  });

  // Cargar el catálogo de certificaciones
  const loadCertifications = async () => {
    try {
      const response = await fetch('/api/certifications', {
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
  const loadCertificates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/companies/${companyId}/certificates`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los certificados");
      }

      const data = await response.json();
      setCertificates(data.items || []);
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

      if (!newCertificate.expirationDate) {
        toast.error("La fecha de vencimiento es requerida");
        return;
      }

      if (!newCertificate.certificateFile) {
        toast.error("El archivo del certificado es requerido");
        return;
      }

      setSubmitting(true);

      const formData = new FormData();
      formData.append("certificationId", newCertificate.certificationId);
      formData.append("expirationDate", newCertificate.expirationDate);
      formData.append("certificateFile", newCertificate.certificateFile);

      const response = await fetch(`/api/companies/${companyId}/certificates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al agregar el certificado");
      }

      toast.success("Certificado agregado correctamente");
      setNewCertificate({
        certificationId: "",
        certificateFile: null,
        expirationDate: "",
      });
      loadCertificates();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error al agregar el certificado");
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
      setCertificates((prev) => prev.filter((cert) => cert.id !== certificate.id));

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
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar el certificado");
    }
  };

  useEffect(() => {
    if (open) {
      loadCertifications();
      loadCertificates();
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader className="mb-4">
            <DialogTitle>
              <span className="text-muted-foreground">Certificados de </span>
              <span className="text-blue-500 dark:text-blue-400 font-bold">{companyName}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Formulario para agregar certificado */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Certificación</Label>
                <Select
                  value={newCertificate.certificationId}
                  onValueChange={(value) =>
                    setNewCertificate((prev) => ({ ...prev, certificationId: value }))
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
                <Input
                  type="file"
                  onChange={(e) =>
                    setNewCertificate((prev) => ({
                      ...prev,
                      certificateFile: e.target.files?.[0] || null,
                    }))
                  }
                  accept=".pdf,.doc,.docx"
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                onClick={handleAddCertificate}
                disabled={submitting}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Agregar Certificado
              </Button>
            </div>

            {/* Tabla de certificados */}
            <div className="rounded-md border mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Certificación</TableHead>
                      <TableHead className="whitespace-nowrap">Archivo</TableHead>
                      <TableHead className="whitespace-nowrap">Vence</TableHead>
                      <TableHead className="w-20 text-center whitespace-nowrap">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </TableCell>
                      </TableRow>
                    ) : certificates.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-24 text-center"
                        >
                          No hay certificados registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      certificates.map((cert) => (
                        <TableRow key={cert.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {cert.certification.name}
                          </TableCell>
                          <TableCell>
                            {cert.certificateFileName && (
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <button
                                  onClick={() => handleDownload(cert.id)}
                                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[200px]"
                                >
                                  {cert.certificateFileName}
                                </button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {new Date(cert.expirationDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCertificate(cert)}
                              className="mx-auto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      <AlertDialog open={!!certificateToDelete} onOpenChange={() => setCertificateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el certificado &quot;{certificateToDelete?.certification.name}&quot; y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteCertificate(certificateToDelete!)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
