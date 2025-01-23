import { z } from "zod";

export const catAlcancesSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  num: z.number().min(1, "El número debe ser mayor a 0"),
  description: z.string().optional(),
  specialtyId: z.number().min(1, "La especialidad es requerida"),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
});

export type CatAlcancesFormValues = z.infer<typeof catAlcancesSchema>;
