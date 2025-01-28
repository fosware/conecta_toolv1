import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    await getUserFromToken();

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Verificar si el asociado existe
    const associate = await prisma.associate.findUnique({
      where: { id, isDeleted: false },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!associate) {
      return NextResponse.json(
        { error: "Asociado no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(associate.user ? [associate.user] : []);
  } catch (error) {
    console.error("Error fetching associate users:", error);
    return NextResponse.json(
      { error: "Error al obtener los usuarios del asociado" },
      { status: 500 }
    );
  }
}
