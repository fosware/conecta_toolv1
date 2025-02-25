import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function PATCH(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    
    let userId: number;
    try {
      userId = await getUserFromToken();
    } catch (error) {
      console.error("Error al obtener el userId:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Error de autorización" },
        { status: 401 }
      );
    }

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "ID de especialidad no proporcionado o inválido" },
        { status: 400 }
      );
    }

    // Obtener el estado actual
    const currentSpecialty = await prisma.specialties.findUnique({
      where: { id: parseInt(id) },
    });

    if (!currentSpecialty) {
      return NextResponse.json(
        { error: "Especialidad no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar al estado opuesto
    const specialty = await prisma.specialties.update({
      where: {
        id: parseInt(id),
      },
      data: {
        isActive: !currentSpecialty.isActive,
        userId,
      },
    });

    return NextResponse.json(specialty);
  } catch (error) {
    console.error("Error al actualizar estado de especialidad:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
