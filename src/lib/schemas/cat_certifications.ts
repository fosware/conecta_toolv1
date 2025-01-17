import { z } from "zod";

export const catCertificationsSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().nullable().optional(),
  userId: z.string().optional(),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

export type catCertificationsFormData = z.infer<typeof catCertificationsSchema>;

export interface Certificacion extends catCertificationsFormData {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
