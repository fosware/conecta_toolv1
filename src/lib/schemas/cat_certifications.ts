import { z } from "zod";

export const catCertificationsSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().nullable().optional(),
});

export type CatCertificationType = z.infer<typeof catCertificationsSchema>;
