import { z } from "zod";

export const projectQuoteCreateSchema = z.object({
  projectId: z.coerce.number().min(1, "El proyecto es requerido"),
  companyId: z.coerce.number().min(1, "La empresa es requerida"),
  deadline: z.coerce.date({
    required_error: "La fecha límite es requerida",
    invalid_type_error: "La fecha límite debe ser una fecha válida",
  }),
  itemDescription: z.string().min(1, "La descripción es requerida"),
  userId: z.number().min(1, "El usuario es requerido"),
});
