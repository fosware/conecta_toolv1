import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Consultar usuarios con sus relaciones
    const usuarios = await prisma.user.findMany({
      include: {
        profile: {
          select: {
            name: true,
            first_lastname: true,
            second_lastname: true,
          },
        },
        role: {
          select: {
            name: true,
          },
        },
      },
      where: {
        isDeleted: false, // Excluir usuarios eliminados lógicamente
      },
    });

    // Formatear los datos para el front
    const formattedUsuarios = usuarios.map((usuario) => ({
      id: usuario.id,
      email: usuario.email,
      username: usuario.username,
      isActive: usuario.isActive,
      profile: usuario.profile,
      role: usuario.role,
    }));

    return NextResponse.json(formattedUsuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { message: "Error al obtener usuarios." },
      { status: 500 }
    );
  }
}
