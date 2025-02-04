import { z } from "zod";

export const companyCreateSchema = z.object({
  companyName: z.string().min(1, "El nombre de la empresa es requerido"),
  contactName: z.string().min(1, "El nombre del contacto es requerido"),
  street: z.string().min(1, "La calle es requerida"),
  externalNumber: z.string().min(1, "El número exterior es requerido"),
  internalNumber: z.string().nullable(),
  neighborhood: z.string().min(1, "La colonia es requerida"),
  postalCode: z.string().min(5, "El código postal debe tener al menos 5 caracteres"),
  city: z.string().min(1, "La ciudad es requerida"),
  stateId: z.number().min(1, "El estado es requerido"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  email: z.string().email("El correo electrónico no es válido"),
  machineCount: z.number().min(0, "El número de máquinas no puede ser negativo"),
  employeeCount: z.number().min(0, "El número de empleados no puede ser negativo"),
  shifts: z.string().nullable(),
  achievementDescription: z.string().nullable(),
  profile: z.string().nullable(),
});

export const companyUpdateSchema = companyCreateSchema.partial();
