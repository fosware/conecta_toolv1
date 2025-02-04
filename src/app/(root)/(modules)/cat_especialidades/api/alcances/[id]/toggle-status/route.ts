import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const scopeId = parseInt(id);
    if (isNaN(scopeId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const alcance = await prisma.scopes.findUnique({
      where: { id: scopeId },
    });

    if (!alcance) {
      return NextResponse.json(
        { error: "Alcance no encontrado" },
        { status: 404 }
      );
    }

    const updatedAlcance = await prisma.scopes.update({
      where: { id: scopeId },
      data: {
        isActive: !alcance.isActive,
      },
    });

    return NextResponse.json(updatedAlcance);
  } catch (error) {
    console.error("Error al actualizar el estado del alcance:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado" },
      { status: 500 }
    );
  }
}
