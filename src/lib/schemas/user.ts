import { z } from "zod";

export const userSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "El nombre es obligatorio"),
    first_lastname: z.string().min(1, "El primer apellido es obligatorio"),
    second_lastname: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().email("Debe ser un correo válido"),
    username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),

    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .optional(),
    confirmPassword: z.string().optional(),
    roleId: z.string().nonempty("El rol es obligatorio"),
    image_profile: z
      .custom<
        File | null | undefined
      >((value) => value instanceof File || value === null || value === undefined, "Debe ser un archivo válido")
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

export type UserFormData = z.infer<typeof userSchema>;
