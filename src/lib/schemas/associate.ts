import { z } from "zod";

export const associateSchema = z.object({
  id: z.number(),
  companyName: z.string().min(1, "El nombre de la empresa es requerido"),
  contactName: z.string().min(1, "El nombre del contacto es requerido"),
  street: z.string().min(1, "La calle es requerida"),
  externalNumber: z.string().min(1, "El número exterior es requerido"),
  internalNumber: z.string().nullable().optional(),
  neighborhood: z.string().min(1, "La colonia es requerida"),
  postalCode: z.string()
    .min(5, "El código postal debe tener 5 dígitos")
    .max(5, "El código postal debe tener 5 dígitos")
    .regex(/^\d+$/, "El código postal solo debe contener números"),
  city: z.string().min(1, "La ciudad es requerida"),
  stateId: z.number({
    required_error: "El estado es requerido",
    invalid_type_error: "El estado debe ser un número",
  }).min(1, "El estado es requerido"),
  phone: z.string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .regex(/^\d+$/, "El teléfono solo debe contener números"),
  email: z.string()
    .min(1, "El correo electrónico es requerido")
    .email("El formato del correo electrónico no es válido"),
  machineCount: z
    .number({
      required_error: "El número de máquinas es requerido",
      invalid_type_error: "El número de máquinas debe ser un número",
    })
    .min(0, "El número de máquinas no puede ser negativo"),
  employeeCount: z
    .number({
      required_error: "El número de empleados es requerido",
      invalid_type_error: "El número de empleados debe ser un número",
    })
    .min(0, "El número de empleados no puede ser negativo"),
  shifts: z.string().default(""),
  achievementDescription: z.string().nullable().optional(),
  profile: z.string().nullable().optional(),
  nda: z
    .any()
    .nullable()
    .optional(),
  ndaFileName: z.string().nullable().optional(),
  companyLogo: z
    .string()
    .nullable()
    .optional(),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
  dateDeleted: z.date().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  userId: z.number().optional(),
});

export const associateCreateSchema = associateSchema.omit({
  isDeleted: true,
  dateDeleted: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.number().optional(),
});

export const certificationSchema = z.object({
  id: z.number(),
  certificationId: z.number().min(1, "El certificado es requerido"),
  certificationFile: z.instanceof(Buffer).nullable(),
  expiryDate: z.date(),
  associateId: z.number(),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  certification: z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable(),
  }).optional(),
});

export const certificationCatalogSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
});

export type Associate = z.infer<typeof associateSchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type CertificationCatalog = z.infer<typeof certificationCatalogSchema>;
export type AssociateFormData = z.infer<typeof associateCreateSchema> & {
  locationState?: {
    id: number;
    name: string;
  };
};
