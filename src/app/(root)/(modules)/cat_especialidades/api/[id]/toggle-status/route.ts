import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const especialidad = await prisma.specialties.findUnique({
      where: { id },
    });

    if (!especialidad) {
      return NextResponse.json(
        { error: "Especialidad no encontrada" },
        { status: 404 }
      );
    }

    const updatedEspecialidad = await prisma.specialties.update({
      where: { id },
      data: {
        isActive: !especialidad.isActive,
      },
    });

    return NextResponse.json(updatedEspecialidad);
  } catch (error) {
    console.error("Error al actualizar el estado de la especialidad:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado" },
      { status: 500 }
    );
  }
}
