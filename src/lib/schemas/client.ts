import { z } from "zod";

export const clientSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "El nombre es requerido"),
  registered_address: z.string().min(1, "La dirección fiscal es requerida"),
  rfc: z.string().min(12, "El RFC debe tener al menos 12 caracteres").max(13, "El RFC no puede tener más de 13 caracteres"),
  isActive: z.boolean(),
  isDeleted: z.boolean(),
  dateDeleted: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.number(),
});

export const clientCreateSchema = clientSchema.omit({
  id: true,
  isActive: true,
  isDeleted: true,
  dateDeleted: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});

export const clientUpdateSchema = clientCreateSchema.partial();

export type Client = z.infer<typeof clientSchema>;
export type ClientCreate = z.infer<typeof clientCreateSchema>;
export type ClientUpdate = z.infer<typeof clientUpdateSchema>;

export const clientAreaSchema = z.object({
  id: z.number(),
  clientId: z.number(),
  areaName: z.string().min(1, "El nombre del área es requerido"),
  contactName: z.string().min(1, "El nombre del contacto es requerido"),
  contactEmail: z.string().email("El correo electrónico no es válido"),
  contactPhone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  observations: z.string().nullable(),
  isActive: z.boolean(),
  isDeleted: z.boolean(),
  dateDeleted: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const clientAreaCreateSchema = clientAreaSchema.omit({
  id: true,
  isActive: true,
  isDeleted: true,
  dateDeleted: true,
  createdAt: true,
  updatedAt: true,
});

export const clientAreaUpdateSchema = clientAreaCreateSchema.partial();

export type ClientArea = z.infer<typeof clientAreaSchema>;
export type ClientAreaCreate = z.infer<typeof clientAreaCreateSchema>;
export type ClientAreaUpdate = z.infer<typeof clientAreaUpdateSchema>;
