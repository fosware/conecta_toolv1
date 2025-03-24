import { z } from "zod";

export const projectRequestLogSchema = z.object({
  message: z.string().min(1, "El mensaje es requerido"),
  projectRequestCompanyId: z.number().int().positive("ID de compañía de solicitud de proyecto inválido")
});

export const projectRequestLogUpdateSchema = z.object({
  id: z.number().int().positive("ID inválido"),
  isActive: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
  dateDeleted: z.date().optional().nullable()
});

export type ProjectRequestLogFormData = z.infer<typeof projectRequestLogSchema>;
export type ProjectRequestLogUpdateData = z.infer<typeof projectRequestLogUpdateSchema>;
