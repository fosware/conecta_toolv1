import { z } from "zod";

// Esquema para el staff existente (para edición)
export const existingStaffSchema = z.object({
  userId: z.number(),
  companyId: z.number(),
  role: z.string(),
  position: z.string().optional(),
});

// Esquema para crear/actualizar staff
export const staffSchema = z.object({
  email: z.string().email("Email inválido"),
  username: z.string().min(1, "El usuario es requerido"),
  role: z.string().min(1, "El puesto es requerido"),
  // Campos de perfil
  name: z.string().min(1, "El nombre es requerido"),
  first_lastname: z.string().min(1, "El apellido paterno es requerido"),
  second_lastname: z.string().optional(),
  phone: z.string().optional(),
  staff: existingStaffSchema.optional(),
});

export type StaffFormData = z.infer<typeof staffSchema>;
