import { z } from "zod";

// Schema principal para ProjectRequest
export const projectRequestSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "El título es requerido"),
  clientAreaId: z.coerce.number().min(1, "El área del cliente es requerida"),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
  dateDeleted: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.number(),
});

// Schema para creación de ProjectRequest
export const projectRequestCreateSchema = projectRequestSchema.omit({
  id: true,
  isActive: true,
  isDeleted: true,
  dateDeleted: true,
  createdAt: true,
  updatedAt: true,
});

// Schema para actualización de ProjectRequest
export const projectRequestUpdateSchema = projectRequestCreateSchema.partial();

// Tipos inferidos
export type ProjectRequest = z.infer<typeof projectRequestSchema>;
export type ProjectRequestCreate = z.infer<typeof projectRequestCreateSchema>;
export type ProjectRequestUpdate = z.infer<typeof projectRequestUpdateSchema>;

// Schema para ProjectRequestDetails
export const projectRequestDetailsSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "El nombre es requerido"),
  projectRequestId: z.number(),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
  dateDeleted: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.number(),
});

// Schema para creación de ProjectRequestDetails
export const projectRequestDetailsCreateSchema = projectRequestDetailsSchema.omit({
  id: true,
  isActive: true,
  isDeleted: true,
  dateDeleted: true,
  createdAt: true,
  updatedAt: true,
});

// Schema para actualización de ProjectRequestDetails
export const projectRequestDetailsUpdateSchema = projectRequestDetailsCreateSchema.partial();

// Tipos inferidos
export type ProjectRequestDetails = z.infer<typeof projectRequestDetailsSchema>;
export type ProjectRequestDetailsCreate = z.infer<typeof projectRequestDetailsCreateSchema>;
export type ProjectRequestDetailsUpdate = z.infer<typeof projectRequestDetailsUpdateSchema>;

// Schema para RequirementCertification
export const requirementCertificationSchema = z.object({
  id: z.number(),
  projectDetailsId: z.number(),
  certificationId: z.coerce.number().min(1, "La certificación es requerida"),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
  dateDeleted: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.number(),
});

// Schema para creación de RequirementCertification
export const requirementCertificationCreateSchema = requirementCertificationSchema.omit({
  id: true,
  isActive: true,
  isDeleted: true,
  dateDeleted: true,
  createdAt: true,
  updatedAt: true,
});

// Schema para RequirementSpecialty
export const requirementSpecialtySchema = z.object({
  id: z.number(),
  projectDetailsId: z.number(),
  specialtyId: z.coerce.number().min(1, "La especialidad es requerida"),
  scopeId: z.coerce.number().nullable(),
  subscopeId: z.coerce.number().nullable(),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
  dateDeleted: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.number(),
});

// Schema para creación de RequirementSpecialty
export const requirementSpecialtyCreateSchema = requirementSpecialtySchema.omit({
  id: true,
  isActive: true,
  isDeleted: true,
  dateDeleted: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos inferidos
export type RequirementCertification = z.infer<typeof requirementCertificationSchema>;
export type RequirementCertificationCreate = z.infer<typeof requirementCertificationCreateSchema>;
export type RequirementSpecialty = z.infer<typeof requirementSpecialtySchema>;
export type RequirementSpecialtyCreate = z.infer<typeof requirementSpecialtyCreateSchema>;

// Schema para el formulario completo (ProjectRequest + Details + Requirements)
export const projectRequestFormSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  clientAreaId: z.coerce.number().min(1, "El área del cliente es requerida"),
  details: z.array(
    z.object({
      name: z.string().min(1, "El nombre del requerimiento es requerido"),
      certifications: z.array(z.coerce.number()).optional(),
      specialties: z.array(z.coerce.number()).optional(),
      scopeId: z.coerce.number().nullable().optional(),
      subscopeId: z.coerce.number().nullable().optional(),
    })
  ).min(1, "Debe agregar al menos un requerimiento"),
});

export type ProjectRequestForm = z.infer<typeof projectRequestFormSchema>;
