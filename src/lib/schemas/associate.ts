import { z } from "zod";

export const associateSchema = z.object({
  id: z.number(),
  companyName: z.string().min(1, "El nombre de la empresa es requerido"),
  contactName: z.string().min(1, "El nombre del contacto es requerido"),
  street: z.string().min(1, "La calle es requerida"),
  externalNumber: z.string().min(1, "El número exterior es requerido"),
  internalNumber: z.string().optional(),
  neighborhood: z.string().min(1, "La colonia es requerida"),
  postalCode: z.string().min(5, "El código postal debe tener 5 dígitos").max(5),
  city: z.string().min(1, "La ciudad es requerida"),
  stateId: z.number({
    required_error: "El estado es requerido",
    invalid_type_error: "El estado debe ser un número",
  }),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  email: z.string().email("El correo electrónico no es válido"),
  machineCount: z
    .number({
      required_error: "El número de máquinas es requerido",
      invalid_type_error: "Debe ser un número",
    })
    .min(0, "El número de máquinas no puede ser negativo"),
  employeeCount: z
    .number({
      required_error: "El número de empleados es requerido",
      invalid_type_error: "Debe ser un número",
    })
    .min(0, "El número de empleados no puede ser negativo"),
  shifts: z.string().min(1, "Los turnos son requeridos"),
  achievementDescription: z.string().optional(),
  profile: z.string().optional(),
  nda: z.custom<File | null>((val) => val instanceof File || val === null).optional(),
  ndaFileName: z.string().nullable().optional(),
  companyLogo: z.union([z.string(), z.custom<File>((val) => val instanceof File), z.null()]).optional(),
  isActive: z
    .boolean({ required_error: "El estado activo es requerido" })
    .default(true),
  isDeleted: z
    .boolean({ required_error: "El estado eliminado es requerido" })
    .default(false),
  dateDeleted: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  userId: z.number().optional(),
});

export type Associate = z.infer<typeof associateSchema>;

export const associateCreateSchema = associateSchema.omit({
  id: true,
  isDeleted: true,
  dateDeleted: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});
