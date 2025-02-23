import { z } from "zod";

export const projectCreateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  projectTypeId: z.coerce.number().min(1, "El tipo de proyecto es requerido"),
  clientId: z.coerce.number().min(1, "El cliente es requerido"),
  clientAreaId: z.coerce.number().min(1, "El área del cliente es requerida"),
  drawRequest: z.instanceof(File).optional(),
  nameDrawRequest: z.string().optional(),
  specialRequest: z.boolean().default(false),
  descriptionSpecialRequest: z.string().optional(),
  generalDescription: z.string().optional(),
});

export const projectQuoteCreateSchema = z.object({
  projectId: z.string().min(1, "El proyecto es requerido"),
  companyId: z.string().min(1, "El asociado es requerido"),
  deadline: z.string().min(1, "La fecha límite es requerida"),
  itemDescription: z.string().min(1, "La descripción del elemento es requerida"),
});

export type ProjectFormData = z.infer<typeof projectCreateSchema>;
export type ProjectQuoteFormData = z.infer<typeof projectQuoteCreateSchema>;
