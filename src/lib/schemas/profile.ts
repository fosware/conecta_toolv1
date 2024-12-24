import { z } from "zod";

// Esquema de validación con Zod
export const profileSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio"),
    first_lastname: z.string().min(1, "El primer apellido es obligatorio"),
    second_lastname: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Debe ser un correo válido"),
    username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
    password: z
      .string()
      .nullable()
      .optional()
      .refine((val) => !val || val.length >= 6, {
        message: "La contraseña debe tener al menos 6 caracteres",
      }),
    confirmPassword: z.string().nullable().optional(),
    image: z
      .custom<
        File | null | undefined
      >((file) => !file || file instanceof File, "Debe ser un archivo válido")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Las contraseñas no coinciden",
      });
    }
  });

// Exporta el tipo inferido
export type ProfileFormData = z.infer<typeof profileSchema>;
