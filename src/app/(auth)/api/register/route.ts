import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

// Esquema de validación para el registro
const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(8),
  name: z.string().min(2),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, password, name } = registerSchema.parse(body);

    // Verificar si el correo ya está registrado
    const existingUserByEmail = await prisma.user.findFirst({
      where: { 
        email: email,
        isDeleted: false
      },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "El correo electrónico ya está registrado" },
        { status: 400 }
      );
    }

    // Verificar si el nombre de usuario ya está registrado
    const existingUserByUsername = await prisma.user.findFirst({
      where: { 
        username: username,
        isDeleted: false
      },
    });

    if (existingUserByUsername) {
      return NextResponse.json(
        { error: "El nombre de usuario ya está en uso" },
        { status: 400 }
      );
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        roleId: 1, // ID del rol "user"
        isActive: true,
        isDeleted: false,
      },
    });

    // Excluir la contraseña de la respuesta
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: "Usuario registrado exitosamente",
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en el registro:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos de registro inválidos", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Error al registrar el usuario" },
      { status: 500 }
    );
  }
}
