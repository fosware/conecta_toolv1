import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Company } from "@prisma/client";
import { getToken } from "@/lib/auth";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";

interface LocationState {
  id: number;
  name: string;
}

interface CompanyFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<Company>;
  isSubmitting?: boolean;
  validationErrors?: { field: string; message: string }[];
}

interface CompanyFormData
  extends Omit<
    Company,
    "id" | "createdAt" | "updatedAt" | "dateDeleted" | "nda" | "companyLogo"
  > {
  companyLogo?: File;
  nda?: File;
}

export function CompanyForm({
  onSubmit,
  onCancel,
  initialData,
  isSubmitting = false,
  validationErrors = [],
}: CompanyFormProps) {
  const { refresh: refreshUserRole } = useUserRole();
  const [formState, setFormState] = useState<Partial<CompanyFormData>>({
    companyName: initialData?.companyName || "",
    comercialName: initialData?.comercialName || "",
    contactName: initialData?.contactName || "",
    street: initialData?.street || "",
    externalNumber: initialData?.externalNumber || "",
    internalNumber: initialData?.internalNumber || "",
    neighborhood: initialData?.neighborhood || "",
    postalCode: initialData?.postalCode || "",
    city: initialData?.city || "",
    stateId: initialData?.stateId || 0,
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    website: initialData?.website || "",
    machineCount: initialData?.machineCount || 0,
    employeeCount: initialData?.employeeCount || 0,
    shifts: initialData?.shifts || "",
    achievementDescription: initialData?.achievementDescription || "",
    profile: initialData?.profile || "",
    shiftsProfileLink: initialData?.shiftsProfileLink || "",
  });

  const [statesList, setStatesList] = useState<LocationState[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(
    initialData?.companyLogo
      ? `data:image/png;base64,${initialData.companyLogo}`
      : null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ndaInputRef = useRef<HTMLInputElement>(null);

  // Cargar estados
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

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "number") {
      setFormState((prev) => ({
        ...prev,
        [name]: parseInt(value) || 0,
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "companyLogo" | "nda"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormState((prev) => ({ ...prev, [field]: file }));

      // Si es el logo, crear preview
      if (field === "companyLogo") {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();

    Object.entries(formState).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "companyLogo" || key === "nda") {
          if (value instanceof File) {
            formData.append(key, value);
          }
        } else {
          formData.append(key, String(value));
        }
      }
    });

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Primera sección: Logo y datos principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna izquierda: Logo y correo */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Logo de la empresa</Label>
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-32 w-32">
                {previewImage ? (
                  <div className="relative group">
                    <img
                      src={previewImage}
                      alt="Logo preview"
                      className="rounded-full object-cover w-32 h-32"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-white hover:text-white"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Examinar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-32 h-32 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Subir Logo
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "companyLogo")}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formState.email || ""}
              onChange={handleInputChange}
              required
            />
            {validationErrors.find((err) => err.field === "email") && (
              <p className="text-sm text-red-500">
                {validationErrors.find((err) => err.field === "email")?.message}
              </p>
            )}
          </div>
        </div>

        {/* Columna derecha: Datos principales */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comercialName">Nombre comercial *</Label>
            <Input
              id="comercialName"
              name="comercialName"
              value={formState.comercialName || ""}
              onChange={handleInputChange}
              required
            />
            {validationErrors.find((err) => err.field === "comercialName") && (
              <p className="text-sm text-red-500">
                {
                  validationErrors.find((err) => err.field === "comercialName")
                    ?.message
                }
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">Contacto Principal de Ventas *</Label>
            <Input
              id="contactName"
              name="contactName"
              value={formState.contactName || ""}
              onChange={handleInputChange}
              required
            />
            {validationErrors.find((err) => err.field === "contactName") && (
              <p className="text-sm text-red-500">
                {
                  validationErrors.find((err) => err.field === "contactName")
                    ?.message
                }
              </p>
            )}
          </div>

          <div className="space-y-4">
            <Label htmlFor="phone">Teléfono *</Label>
            <Input
              id="phone"
              name="phone"
              value={formState.phone || ""}
              onChange={handleInputChange}
              required
            />
            {validationErrors.find((err) => err.field === "phone") && (
              <p className="text-sm text-red-500">
                {validationErrors.find((err) => err.field === "phone")?.message}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="companyName">Razón social *</Label>
        <Input
          id="companyName"
          name="companyName"
          value={formState.companyName || ""}
          onChange={handleInputChange}
          required
        />
        {validationErrors.find((err) => err.field === "companyName") && (
          <p className="text-sm text-red-500">
            {
              validationErrors.find((err) => err.field === "companyName")
                ?.message
            }
          </p>
        )}
      </div>
      <div className="space-y-4">
        <Label htmlFor="website">Página web</Label>
        <Input
          id="website"
          name="website"
          value={formState.website || ""}
          onChange={handleInputChange}
          placeholder="https://ejemplo.com"
        />
        {formState.website && (
          <a
            href={
              formState.website.startsWith("http")
                ? formState.website
                : `https://${formState.website}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            {formState.website}
          </a>
        )}
      </div>

      {/* Segunda sección: Dirección y otros datos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="street">Calle *</Label>
          <Input
            id="street"
            name="street"
            value={formState.street || ""}
            onChange={handleInputChange}
            required
          />
          {validationErrors.find((err) => err.field === "street") && (
            <p className="text-sm text-red-500">
              {validationErrors.find((err) => err.field === "street")?.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="externalNumber">Número Exterior *</Label>
          <Input
            id="externalNumber"
            name="externalNumber"
            value={formState.externalNumber || ""}
            onChange={handleInputChange}
            required
          />
          {validationErrors.find((err) => err.field === "externalNumber") && (
            <p className="text-sm text-red-500">
              {
                validationErrors.find((err) => err.field === "externalNumber")
                  ?.message
              }
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="internalNumber">Número Interior</Label>
          <Input
            id="internalNumber"
            name="internalNumber"
            value={formState.internalNumber || ""}
            onChange={handleInputChange}
          />
          {validationErrors.find((err) => err.field === "internalNumber") && (
            <p className="text-sm text-red-500">
              {
                validationErrors.find((err) => err.field === "internalNumber")
                  ?.message
              }
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="neighborhood">Colonia *</Label>
          <Input
            id="neighborhood"
            name="neighborhood"
            value={formState.neighborhood || ""}
            onChange={handleInputChange}
            required
          />
          {validationErrors.find((err) => err.field === "neighborhood") && (
            <p className="text-sm text-red-500">
              {
                validationErrors.find((err) => err.field === "neighborhood")
                  ?.message
              }
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">Código Postal *</Label>
          <Input
            id="postalCode"
            name="postalCode"
            value={formState.postalCode || ""}
            onChange={handleInputChange}
            required
          />
          {validationErrors.find((err) => err.field === "postalCode") && (
            <p className="text-sm text-red-500">
              {
                validationErrors.find((err) => err.field === "postalCode")
                  ?.message
              }
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ciudad *</Label>
          <Input
            id="city"
            name="city"
            value={formState.city || ""}
            onChange={handleInputChange}
            required
          />
          {validationErrors.find((err) => err.field === "city") && (
            <p className="text-sm text-red-500">
              {validationErrors.find((err) => err.field === "city")?.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stateId">Estado *</Label>
          <select
            id="stateId"
            name="stateId"
            value={formState.stateId?.toString() || ""}
            onChange={handleInputChange}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="">Seleccionar estado</option>
            {statesList.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
          {validationErrors.find((err) => err.field === "stateId") && (
            <p className="text-sm text-red-500">
              {validationErrors.find((err) => err.field === "stateId")?.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="machineCount">Número de máquinas principales *</Label>
          <Input
            id="machineCount"
            name="machineCount"
            type="number"
            min="0"
            value={formState.machineCount || 0}
            onChange={handleInputChange}
            required
          />
          {validationErrors.find((err) => err.field === "machineCount") && (
            <p className="text-sm text-red-500">
              {
                validationErrors.find((err) => err.field === "machineCount")
                  ?.message
              }
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="employeeCount">Número de Empleados *</Label>
          <Input
            id="employeeCount"
            name="employeeCount"
            type="number"
            min="0"
            value={formState.employeeCount || 0}
            onChange={handleInputChange}
            required
          />
          {validationErrors.find((err) => err.field === "employeeCount") && (
            <p className="text-sm text-red-500">
              {
                validationErrors.find((err) => err.field === "employeeCount")
                  ?.message
              }
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="shifts">Turnos</Label>
          <Input
            id="shifts"
            name="shifts"
            value={formState.shifts || ""}
            onChange={handleInputChange}
          />
          {validationErrors.find((err) => err.field === "shifts") && (
            <p className="text-sm text-red-500">
              {validationErrors.find((err) => err.field === "shifts")?.message}
            </p>
          )}
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
                      window.open(
                        `/api/companies/${initialData.id}/nda`,
                        "_blank"
                      );
                    }
                  }}
                >
                  {initialData.ndaFileName}
                </Button>
              </div>
            )}
            <input
              id="nda"
              name="nda"
              accept=".pdf"
              onChange={(e) => handleFileChange(e, "nda")}
              className="text-sm w-full"
              type="file"
            />
            {formState.nda && (
              <p className="text-sm text-gray-500">
                Archivo seleccionado: {formState.nda.name}
              </p>
            )}
          </div>
          {validationErrors.find((err) => err.field === "nda") && (
            <p className="text-sm text-red-500">
              {validationErrors.find((err) => err.field === "nda")?.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="achievementDescription" className="block">
          Logros
        </Label>
        <textarea
          id="achievementDescription"
          name="achievementDescription"
          value={formState.achievementDescription || ""}
          onChange={handleInputChange}
          rows={8}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {validationErrors.find(
          (err) => err.field === "achievementDescription"
        ) && (
          <p className="text-sm text-red-500">
            {
              validationErrors.find(
                (err) => err.field === "achievementDescription"
              )?.message
            }
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile" className="block">
          Semblanza
        </Label>
        <textarea
          id="profile"
          name="profile"
          value={formState.profile || ""}
          onChange={handleInputChange}
          rows={8}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {validationErrors.find((err) => err.field === "profile") && (
          <p className="text-sm text-red-500">
            {validationErrors.find((err) => err.field === "profile")?.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="shiftsProfileLink">Logros y semblanza liga</Label>
        <Input
          id="shiftsProfileLink"
          name="shiftsProfileLink"
          value={formState.shiftsProfileLink || ""}
          onChange={handleInputChange}
          placeholder="https://ejemplo.com/logros"
        />
        {formState.shiftsProfileLink && (
          <a
            href={
              formState.shiftsProfileLink.startsWith("http")
                ? formState.shiftsProfileLink
                : `https://${formState.shiftsProfileLink}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            {formState.shiftsProfileLink}
          </a>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
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
