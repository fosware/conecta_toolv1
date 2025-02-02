"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { type CertificationCatalog } from "@/lib/schemas/associate";
import { FileText, Loader2, Trash2 } from "lucide-react";

interface CertificatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  associateId: number;
}

type Certificate = {
  id: number;
  certificationId: number;
  certificationFile: Buffer | null;
  certificationFileName: string;
  expiryDate: Date;
  isActive: boolean;
  isDeleted: boolean;
  certification?: {
    name: string;
    description?: string;
  };
};

export function CertificatesModal({
  isOpen,
  onClose,
  associateId,
}: CertificatesModalProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [catalogCertifications, setCatalogCertifications] = useState<CertificationCatalog[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCertificate, setNewCertificate] = useState({
    certificationId: "",
    expiryDate: "",
    document: null as File | null,
  });

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/asociados/${associateId}/certificates`, {
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
      if (!newCertificate.certificationId || !newCertificate.expiryDate) {
        toast.error("El certificado y la fecha de vencimiento son requeridos");
        return;
      }

      if (!newCertificate.document) {
        toast.error("El documento PDF es requerido");
        return;
      }

      setSubmitting(true);

      const formData = new FormData();
      formData.append("certificationId", newCertificate.certificationId);
      formData.append("expiryDate", newCertificate.expiryDate);
      formData.append("document", newCertificate.document);

      const response = await fetch(`/api/asociados/${associateId}/certificates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error("Error parsing response:", responseText);
        throw new Error("Error al procesar la respuesta del servidor");
      }

      if (!response.ok) {
        if (responseData.details) {
          toast.error(responseData.details[0].message);
        } else {
          toast.error(responseData.error || "Error al agregar el certificado");
        }
        return;
      }

      toast.success("Certificado agregado correctamente");
      setNewCertificate({
        certificationId: "",
        expiryDate: "",
        document: null,
      });
      loadCertificates();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error al agregar el certificado");
    } finally {
      setSubmitting(false);
    }
  };

  const loadCatalogCertifications = async () => {
    try {
      const response = await fetch('/api/certificaciones', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar el catálogo de certificaciones");
      }

      const data = await response.json();
      setCatalogCertifications(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar el catálogo de certificaciones");
    }
  };

  const handleDelete = async (certId: number) => {
    try {
      const response = await fetch(
        `/api/asociados/${associateId}/certificates/${certId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar el certificado");
      }

      toast.success("Certificado eliminado correctamente");
      loadCertificates(); // Recargar la lista
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar el certificado");
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCertificates();
      loadCatalogCertifications();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Certificados</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulario para agregar certificado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="certificationId">Certificado</Label>
              <Select
                value={newCertificate.certificationId}
                onValueChange={(value) =>
                  setNewCertificate({ ...newCertificate, certificationId: value })
                }
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar certificado" />
                </SelectTrigger>
                <SelectContent>
                  {catalogCertifications.map((cert) => (
                    <SelectItem key={cert.id} value={cert.id.toString()}>
                      {cert.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expiryDate">Fecha de vencimiento</Label>
              <Input
                type="date"
                value={newCertificate.expiryDate}
                onChange={(e) =>
                  setNewCertificate({ ...newCertificate, expiryDate: e.target.value })
                }
                disabled={submitting}
              />
            </div>

            <div>
              <Label htmlFor="document">Documento PDF</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) =>
                  setNewCertificate({
                    ...newCertificate,
                    document: e.target.files?.[0] || null,
                  })
                }
                disabled={submitting}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleAddCertificate}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agregar Certificado
            </Button>
          </div>

          {/* Lista de certificados */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificado</TableHead>
                  <TableHead>Fecha de Vencimiento</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : certificates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No hay certificados registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  certificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>{cert.certification?.name}</TableCell>
                      <TableCell>
                        {new Date(cert.expiryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={cert.certificationFileName || "Descargar documento"}
                            onClick={() => window.open(`/api/asociados/${associateId}/certificates/${cert.id}/download`, '_blank')}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {cert.certificationFileName && (
                            <span className="text-sm text-muted-foreground">
                              {cert.certificationFileName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Eliminar certificado"
                          onClick={() => handleDelete(cert.id)}
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
      </DialogContent>
    </Dialog>
  );
}
