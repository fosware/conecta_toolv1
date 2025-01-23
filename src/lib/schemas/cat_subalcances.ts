import { z } from "zod";

export const catSubalcancesSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  num: z.number().min(1, "El número debe ser mayor a 0"),
  description: z.string().optional(),
  scopeId: z.number().min(1, "El alcance es requerido"),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
});

export type CatSubalcancesFormValues = z.infer<typeof catSubalcancesSchema>;
