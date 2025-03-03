"use client";

import React, { useEffect, useState } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ProjectRequestForm } from "@/lib/schemas/project-request";
import { Plus, Trash, Check } from "lucide-react";
import { useForm, UseFormReturn } from "react-hook-form";

interface Certification {
  id: number;
  name: string;
}

interface Specialty {
  id: number;
  name: string;
}

interface Scope {
  id: number;
  name: string;
  specialtyId: number;
}

interface Subscope {
  id: number;
  name: string;
  scopeId: number;
}

interface RequirementFormProps {
  form: UseFormReturn<ProjectRequestForm>;
  index: number;
  isSubmitting?: boolean;
}

const RequirementForm = ({
  form,
  index,
  isSubmitting = false,
}: RequirementFormProps) => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [subscopes, setSubscopes] = useState<Subscope[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Obtener certificaciones y especialidades al cargar el componente
  useEffect(() => {
    // Evitar múltiples llamadas si ya se están cargando los datos
    if (isLoading === false) return;

    let isMounted = true; // Bandera para evitar actualizaciones si el componente se desmonta

    const fetchData = async () => {
      try {
        // Cargar certificaciones
        const certResponse = await fetch("/cat_certificaciones/api", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!certResponse.ok) {
          throw new Error("Error al cargar certificaciones");
        }

        const certData = await certResponse.json();
        if (isMounted) {
          // Verificar la estructura de la respuesta
          if (Array.isArray(certData)) {
            setCertifications(certData);
          } else if (certData.items && Array.isArray(certData.items)) {
            setCertifications(certData.items);
          } else if (certData.certificaciones && Array.isArray(certData.certificaciones)) {
            setCertifications(certData.certificaciones);
          } else {
            console.error("Formato de respuesta inesperado para certificaciones:", certData);
            setCertifications([]);
          }
        }

        // Cargar especialidades
        const specResponse = await fetch("/cat_especialidades/api", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!specResponse.ok) {
          throw new Error("Error al cargar especialidades");
        }

        const specData = await specResponse.json();
        if (isMounted) {
          // Verificar la estructura de la respuesta
          if (Array.isArray(specData)) {
            setSpecialties(specData);
          } else if (specData.items && Array.isArray(specData.items)) {
            setSpecialties(specData.items);
          } else if (specData.especialidades && Array.isArray(specData.especialidades)) {
            setSpecialties(specData.especialidades);
          } else {
            console.error("Formato de respuesta inesperado para especialidades:", specData);
            setSpecialties([]);
          }
        }

        // Verificar si hay datos iniciales para cargar los alcances y subalcances
        const currentDetails = form.getValues(`details.${index}`);
        if (currentDetails && currentDetails.specialties && currentDetails.specialties.length > 0) {
          console.log(`Cargando alcances para especialidades guardadas: ${currentDetails.specialties}`);
          
          // Cargar alcances para cada especialidad
          for (const specialtyId of currentDetails.specialties) {
            if (typeof specialtyId === 'number') {
              await loadScopes(specialtyId);
            }
          }
          
          // Cargar subalcances si hay un alcance seleccionado
          if (currentDetails.scopeId) {
            console.log(`Cargando subalcances para alcance: ${currentDetails.scopeId}`);
            await loadSubscopes(currentDetails.scopeId);
          }
        }
      } catch (error) {
        console.error("Error:", error);
        if (isMounted) toast.error("Error al cargar los datos");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    // Limpieza para evitar actualizaciones si el componente se desmonta
    return () => {
      isMounted = false;
    };
  }, []); // Eliminar las dependencias para evitar el bucle infinito

  // Cargar alcances cuando se selecciona una especialidad
  const loadScopes = async (specialtyId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/cat_especialidades/api/alcances?specialtyId=${specialtyId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los alcances");
      }

      const data = await response.json();
      console.log("Alcances cargados:", data);
      
      // Verificar la estructura de la respuesta
      if (Array.isArray(data)) {
        setScopes(data);
      } else if (data.items && Array.isArray(data.items)) {
        setScopes(data.items);
      } else if (data.alcances && Array.isArray(data.alcances)) {
        setScopes(data.alcances);
      } else {
        console.error("Formato de respuesta inesperado para alcances:", data);
        setScopes([]);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar los alcances");
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar sub-alcances cuando se selecciona un alcance
  const loadSubscopes = async (scopeId: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/cat_especialidades/api/subalcances?scopeId=${scopeId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los sub-alcances");
      }

      const data = await response.json();
      console.log("Sub-alcances cargados:", data);
      
      // Verificar la estructura de la respuesta
      if (Array.isArray(data)) {
        setSubscopes(data);
      } else if (data.items && Array.isArray(data.items)) {
        setSubscopes(data.items);
      } else if (data.subalcances && Array.isArray(data.subalcances)) {
        setSubscopes(data.subalcances);
      } else {
        console.error("Formato de respuesta inesperado para sub-alcances:", data);
        setSubscopes([]);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar los sub-alcances");
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar selección de certificaciones
  const handleCertificationSelection = (certIds: number[]) => {
    form.setValue(`details.${index}.certifications`, certIds);
  };

  // Manejar selección de especialidades
  const handleSpecialtySelection = (specIds: number[]) => {
    form.setValue(`details.${index}.specialties`, specIds);

    // Cargar alcances para la primera especialidad seleccionada
    if (specIds.length > 0) {
      loadScopes(specIds[0]);
    }
  };

  // Agregar certificación
  const addCertification = () => {
    const currentCertifications =
      form.getValues(`details.${index}.certifications`) || [];

    // Evitar agregar certificación si no hay datos cargados
    if (certifications.length === 0) {
      toast.error("No hay certificaciones disponibles");
      return;
    }

    form.setValue(`details.${index}.certifications`, [
      ...currentCertifications,
      certifications.length > 0 ? certifications[0].id : 0,
    ]);
  };

  // Eliminar certificación
  const removeCertification = (certIndex: number) => {
    const currentCertifications =
      form.getValues(`details.${index}.certifications`) || [];
    form.setValue(
      `details.${index}.certifications`,
      currentCertifications.filter((_, i) => i !== certIndex)
    );
  };

  // Agregar especialidad
  const addSpecialty = () => {
    const currentSpecialties =
      form.getValues(`details.${index}.specialties`) || [];

    // Evitar agregar especialidad si no hay datos cargados
    if (specialties.length === 0) {
      toast.error("No hay especialidades disponibles");
      return;
    }

    const defaultSpecialtyId = specialties.length > 0 ? specialties[0].id : 0;

    form.setValue(`details.${index}.specialties`, [
      ...currentSpecialties,
      defaultSpecialtyId,
    ]);

    if (defaultSpecialtyId > 0) {
      loadScopes(defaultSpecialtyId);
    }
  };

  // Eliminar especialidad
  const removeSpecialty = (specIndex: number) => {
    const currentSpecialties =
      form.getValues(`details.${index}.specialties`) || [];
    form.setValue(
      `details.${index}.specialties`,
      currentSpecialties.filter((_, i) => i !== specIndex)
    );
  };

  // Manejar cambio de especialidad
  const handleSpecialtyChange = (value: string, specIndex: number) => {
    const specialtyId = parseInt(value);

    // Evitar operaciones si el ID no es válido
    if (isNaN(specialtyId) || specialtyId <= 0) return;

    const currentSpecialties = form.getValues(`details.${index}.specialties`) || [];
    const updatedSpecialties = [...currentSpecialties];
    updatedSpecialties[specIndex] = specialtyId;
    
    form.setValue(`details.${index}.specialties`, updatedSpecialties);
    form.setValue(`details.${index}.scopeId`, null);
    form.setValue(`details.${index}.subscopeId`, null);
    loadScopes(specialtyId);
  };

  // Manejar cambio de alcance
  const handleScopeChange = (value: string, specIndex: number) => {
    const scopeId = parseInt(value);

    // Evitar operaciones si el ID no es válido
    if (isNaN(scopeId) || scopeId <= 0) return;

    form.setValue(`details.${index}.scopeId`, scopeId);
    form.setValue(`details.${index}.subscopeId`, null);
    loadSubscopes(scopeId);
  };

  return (
    <div className="space-y-4">
      {/* El campo de nombre se ha movido al componente padre */}
      <Separator className="my-4" />

      {/* Sección de Certificaciones */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium">Certificaciones</h4>
        </div>

        <FormField
          control={form.control}
          name={`details.${index}.certifications`}
          render={() => (
            <FormItem>
              <div className="relative">
                <div
                  className={cn(
                    "w-full flex flex-wrap gap-1 p-2 text-sm rounded-md border border-input",
                    isLoading || isSubmitting ? "opacity-50" : ""
                  )}
                >
                  {(form.getValues(`details.${index}.certifications`) || []).length > 0 ? (
                    ((form.getValues(`details.${index}.certifications`) || []) as number[]).map((certId, certIndex) => {
                      const certification = certifications.find(
                        (c) => c.id === certId
                      );
                      return certification ? (
                        <Badge
                          key={certIndex}
                          variant="secondary"
                          className="mb-1 flex items-center gap-1"
                        >
                          {certification.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeCertification(certIndex)}
                          />
                        </Badge>
                      ) : null;
                    })
                  ) : (
                    <div className="text-muted-foreground">
                      Certificaciones seleccionadas
                    </div>
                  )}
                </div>

                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seleccionar certificaciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="max-h-40 overflow-y-auto">
                      {certifications && certifications.length > 0 ? (
                        certifications.map((cert) => {
                          const isSelected = (
                            form.getValues(`details.${index}.certifications`) as number[]
                          ).includes(cert.id);
                          return (
                            <div
                              key={cert.id}
                              className={cn(
                                "flex items-center gap-2 p-2 hover:bg-muted cursor-pointer",
                                isSelected ? "bg-muted" : ""
                              )}
                              onClick={() => {
                                const currentCerts =
                                  form.getValues(
                                    `details.${index}.certifications`
                                  ) || [];
                                const existingIndex = (
                                  currentCerts as number[]
                                ).indexOf(cert.id);

                                if (existingIndex >= 0) {
                                  // Si ya existe, lo eliminamos
                                  const newCerts = [...currentCerts];
                                  newCerts.splice(existingIndex, 1);
                                  form.setValue(
                                    `details.${index}.certifications`,
                                    newCerts
                                  );
                                } else {
                                  // Si no existe, lo añadimos
                                  form.setValue(
                                    `details.${index}.certifications`,
                                    [
                                      ...currentCerts,
                                      cert.id,
                                    ]
                                  );
                                }
                              }}
                            >
                              <div
                                className={cn(
                                  "flex h-4 w-4 items-center justify-center rounded-sm border",
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-primary opacity-50"
                                )}
                              >
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <span>{cert.name}</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-2 text-center text-muted-foreground">
                          No hay certificaciones disponibles
                        </div>
                      )}
                    </div>
                  </SelectContent>
                </Select>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator className="my-4" />

      {/* Sección de Especialidades */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium">Especialidades</h4>
        </div>

        <FormField
          control={form.control}
          name={`details.${index}.specialties`}
          render={() => (
            <FormItem>
              <div className="relative">
                <div
                  className={cn(
                    "w-full flex flex-wrap gap-1 min-h-8 border rounded-md p-2",
                    isLoading || isSubmitting ? "opacity-50" : ""
                  )}
                >
                  {(form.getValues(`details.${index}.specialties`) || []).length > 0 ? (
                    ((form.getValues(`details.${index}.specialties`) || []) as number[]).map((specId, specIndex) => {
                      const specialty = specialties.find(
                        (s) => s.id === specId
                      );
                      return specialty ? (
                        <Badge
                          key={specIndex}
                          variant="secondary"
                          className="mb-1 flex items-center gap-1"
                        >
                          {specialty.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeSpecialty(specIndex)}
                          />
                        </Badge>
                      ) : null;
                    })
                  ) : (
                    <div className="text-muted-foreground">
                      Especialidades seleccionadas
                    </div>
                  )}
                </div>

                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seleccionar especialidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="max-h-40 overflow-y-auto">
                      {specialties && specialties.length > 0 ? (
                        specialties.map((spec) => {
                          const isSelected = form
                            .getValues(`details.${index}.specialties`)
                            ?.includes(spec.id);
                          return (
                            <div
                              key={spec.id}
                              className={cn(
                                "flex items-center gap-2 p-2 hover:bg-muted cursor-pointer",
                                isSelected ? "bg-muted" : ""
                              )}
                              onClick={() => {
                                const currentSpecs =
                                  form.getValues(
                                    `details.${index}.specialties`
                                  ) || [];
                                const existingIndex = currentSpecs.indexOf(
                                  spec.id
                                );

                                if (existingIndex >= 0) {
                                  // Si ya existe, lo eliminamos
                                  const newSpecs = [...currentSpecs];
                                  newSpecs.splice(existingIndex, 1);
                                  form.setValue(
                                    `details.${index}.specialties`,
                                    newSpecs
                                  );
                                } else {
                                  // Si no existe, lo añadimos
                                  form.setValue(`details.${index}.specialties`, [
                                    ...currentSpecs,
                                    spec.id,
                                  ]);

                                  // Cargar alcances para esta especialidad si es la primera seleccionada
                                  if (currentSpecs.length === 0) {
                                    loadScopes(spec.id);
                                  }
                                }
                              }}
                            >
                              <div
                                className={cn(
                                  "flex h-4 w-4 items-center justify-center rounded-sm border",
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-primary opacity-50"
                                )}
                              >
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <span>{spec.name}</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-2 text-center text-muted-foreground">
                          No hay especialidades disponibles
                        </div>
                      )}
                    </div>
                  </SelectContent>
                </Select>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Mostrar selección de alcance y sub-alcance para la primera especialidad seleccionada */}
        {form.getValues(`details.${index}.specialties`) && 
        (form.getValues(`details.${index}.specialties`) || []).length > 0 && (
          <div className="space-y-2 mt-2 p-2 border rounded-md">
            <h5 className="text-xs font-medium">Configuración de alcance</h5>
            <p className="text-xs text-muted-foreground mb-2">
              Configure el alcance para la especialidad:{" "}
              {(form.getValues(`details.${index}.specialties`) || []).length > 0 ?
                (specialties.find(
                  (s) =>
                    s.id ===
                    ((form.getValues(`details.${index}.specialties`) || [])[0] as number)
                )?.name || "No seleccionada") : "No seleccionada"}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name={`details.${index}.scopeId`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Alcance</FormLabel>
                    <Select
                      disabled={
                        isLoading || isSubmitting || scopes.length === 0
                      }
                      onValueChange={(value) => {
                        field.onChange(parseInt(value));
                        loadSubscopes(parseInt(value));
                      }}
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar alcance" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {scopes.map((scope) => (
                          <SelectItem
                            key={scope.id}
                            value={scope.id.toString()}
                          >
                            {scope.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`details.${index}.subscopeId`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Sub-alcance</FormLabel>
                    <Select
                      disabled={
                        isLoading ||
                        isSubmitting ||
                        subscopes.length === 0 ||
                        !((form.getValues(`details.${index}.specialties`) || [])[0] as number)
                      }
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar sub-alcance" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subscopes.map((subscope) => (
                          <SelectItem
                            key={subscope.id}
                            value={subscope.id.toString()}
                          >
                            {subscope.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequirementForm;
