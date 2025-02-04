"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Company, LocationState } from "@/types";
import { FileInput } from "@/components/ui/file-input";
import { getToken } from "@/lib/auth";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface CompanyFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<Company>;
  isSubmitting?: boolean;
}

interface CompanyFormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  street: string;
  externalNumber: string;
  internalNumber: string;
  neighborhood: string;
  postalCode: string;
  city: string;
  stateId: number | undefined;
  machineCount: number;
  employeeCount: number;
  shifts: string;
  achievementDescription: string;
  profile: string;
  companyLogo: File | null;
  nda: File | null;
  ndaFileName: string;
}

export function CompanyForm({
  initialData,
  onSubmit,
  isSubmitting,
}: CompanyFormProps) {
  const [formState, setFormState] = useState<Partial<CompanyFormData>>({
    companyName: initialData?.companyName || "",
    contactName: initialData?.contactName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    street: initialData?.street || "",
    externalNumber: initialData?.externalNumber || "",
    internalNumber: initialData?.internalNumber || "",
    neighborhood: initialData?.neighborhood || "",
    postalCode: initialData?.postalCode || "",
    city: initialData?.city || "",
    stateId: initialData?.stateId || undefined,
    machineCount: initialData?.machineCount || 0,
    employeeCount: initialData?.employeeCount || 0,
    shifts: initialData?.shifts || "",
    achievementDescription: initialData?.achievementDescription || "",
    profile: initialData?.profile || "",
    ndaFileName: initialData?.ndaFileName || "",
  });

  const [statesList, setStatesList] = useState<LocationState[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | undefined>(
    initialData?.stateId
  );
  const [isSubmittingState, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedStateId(initialData?.stateId);
  }, [initialData?.stateId]);

  useEffect(() => {
    const loadStates = async () => {
      try {
        const response = await fetch("/api/states", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });
        if (!response.ok) {
          throw new Error("Error al cargar los estados");
        }
        const data = await response.json();
        setStatesList(data.items || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error al cargar los estados");
      }
    };

    loadStates();
  }, []);

  useEffect(() => {
    // Si hay un logo inicial, establecer la vista previa
    if (initialData?.companyLogo) {
      setPreviewUrl(`data:image/png;base64,${initialData.companyLogo}`);
    }
  }, [initialData?.companyLogo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setFormState((prev) => ({
        ...prev,
        companyLogo: file,
      }));
    }
  };

  const handleNdaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormState((prev) => ({
        ...prev,
        nda: file,
        ndaFileName: file.name,
      }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Agregar los campos que no son archivos
      Object.entries(formState).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'nda' && key !== 'companyLogo' && key !== 'ndaFileName') {
          formData.set(key, value.toString());
        }
      });

      // Manejar el archivo NDA y su nombre
      if (formState.nda) {
        const ndaFile = formState.nda;
        formData.set('nda', ndaFile);
        formData.set('ndaFileName', ndaFile.name);
      } else if (initialData?.ndaFileName) {
        formData.set('ndaFileName', initialData.ndaFileName);
      }

      // Manejar el archivo de logo
      if (formState.companyLogo) {
        formData.set('companyLogo', formState.companyLogo);
      } else if (initialData?.companyLogo) {
        formData.set('companyLogo', initialData.companyLogo);
      }

      await onSubmit(formData);
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      toast.error("Error al guardar los datos");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl && !previewUrl.startsWith("data:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Primera sección: Logo y datos principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna izquierda: Logo y correo */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-48 h-48 border rounded-lg overflow-hidden bg-gray-50 relative flex flex-col items-center justify-center cursor-pointer group">
              {previewUrl || initialData?.companyLogo ? (
                <>
                  <div className="relative w-full h-full">
                    <Image
                      src={
                        previewUrl ||
                        `data:image/png;base64,${initialData?.companyLogo}`
                      }
                      alt="Logo Preview"
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 translate-y-full transition-transform group-hover:translate-y-0">
                    <FileInput
                      id="companyLogo"
                      name="companyLogo"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="text-white text-sm w-full"
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 p-4 w-full">
                  <div className="text-gray-400 text-sm">Sin logo</div>
                  <FileInput
                    id="companyLogo"
                    name="companyLogo"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-sm w-full text-center"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formState.email}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        {/* Columna derecha: Datos principales */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nombre de la Empresa *</Label>
            <Input
              id="companyName"
              name="companyName"
              value={formState.companyName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">Nombre del Contacto *</Label>
            <Input
              id="contactName"
              name="contactName"
              value={formState.contactName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono *</Label>
            <Input
              id="phone"
              name="phone"
              value={formState.phone}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
      </div>

      {/* Segunda sección: Dirección y otros datos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="street">Calle *</Label>
          <Input
            id="street"
            name="street"
            value={formState.street}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="externalNumber">Número Exterior *</Label>
          <Input
            id="externalNumber"
            name="externalNumber"
            value={formState.externalNumber}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="internalNumber">Número Interior</Label>
          <Input
            id="internalNumber"
            name="internalNumber"
            value={formState.internalNumber}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="neighborhood">Colonia *</Label>
          <Input
            id="neighborhood"
            name="neighborhood"
            value={formState.neighborhood}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">Código Postal *</Label>
          <Input
            id="postalCode"
            name="postalCode"
            value={formState.postalCode}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ciudad *</Label>
          <Input
            id="city"
            name="city"
            value={formState.city}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stateId">Estado *</Label>
          <select
            id="stateId"
            name="stateId"
            value={formState.stateId?.toString() || ""}
            onChange={handleInputChange}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="">Seleccionar estado</option>
            {statesList.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="machineCount">Número de Máquinas *</Label>
          <Input
            id="machineCount"
            name="machineCount"
            type="number"
            min="0"
            value={formState.machineCount}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="employeeCount">Número de Empleados *</Label>
          <Input
            id="employeeCount"
            name="employeeCount"
            type="number"
            min="0"
            value={formState.employeeCount}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shifts">Turnos</Label>
          <Input
            id="shifts"
            name="shifts"
            value={formState.shifts}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nda">NDA</Label>
          <div className="flex flex-col gap-2">
            {initialData?.ndaFileName && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Archivo actual:</span>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-blue-500 hover:text-blue-700"
                  onClick={() => {
                    if (initialData.id) {
                      window.open(`/api/companies/${initialData.id}/nda`, '_blank');
                    }
                  }}
                >
                  {initialData.ndaFileName}
                </Button>
              </div>
            )}
            <FileInput
              id="nda"
              name="nda"
              accept=".pdf"
              onChange={handleNdaFileChange}
            />
            {formState.ndaFileName && !initialData?.ndaFileName && (
              <p className="text-sm text-gray-500">
                Archivo seleccionado: {formState.ndaFileName}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="achievementDescription">Descripción de Logros</Label>
        <Textarea
          id="achievementDescription"
          name="achievementDescription"
          value={formState.achievementDescription}
          onChange={handleInputChange}
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile">Perfil</Label>
        <Textarea
          id="profile"
          name="profile"
          value={formState.profile}
          onChange={handleInputChange}
          className="min-h-[100px]"
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => console.log("Cancelar")}
          disabled={isSubmittingState}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmittingState}>
          {isSubmittingState ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando
            </>
          ) : (
            "Guardar"
          )}
        </Button>
      </div>
    </form>
  );
}
