import { z } from "zod";

export const catEspecialidadesSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "El nombre es obligatorio"),
  num: z.number().min(1, "El número es obligatorio"),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
  userId: z.number().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

export type catEspecialidadesFormData = z.infer<typeof catEspecialidadesSchema>;

export interface Especialidad extends catEspecialidadesFormData {
  id: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export const catAlcancesSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "El nombre es obligatorio"),
  num: z.number().min(1, "El número es obligatorio"),
  specialtyId: z.number(),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
  userId: z.number().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

export type catAlcancesFormData = z.infer<typeof catAlcancesSchema>;

export interface Alcance extends catAlcancesFormData {
  id: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export const catSubalcancesSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "El nombre es obligatorio"),
  num: z.number().min(1, "El número es obligatorio"),
  scopeId: z.number(),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
  userId: z.number().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

export type catSubalcancesFormData = z.infer<typeof catSubalcancesSchema>;

export interface Subalcance extends catSubalcancesFormData {
  id: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}
