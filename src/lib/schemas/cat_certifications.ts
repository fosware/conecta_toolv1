import { z } from "zod";

export const catCertificationsSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().nullable().optional(),
  userId: z.string().nonempty("El usuario es obligatorio"),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
  createdAt: z.date().default(new Date()),
  updatedAt: z.date().default(new Date()),
});

export type catCertificationsFormData = z.infer<typeof catCertificationsSchema>;
