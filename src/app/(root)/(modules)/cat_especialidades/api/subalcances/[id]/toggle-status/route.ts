import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const subscopeId = parseInt(id);
    if (isNaN(subscopeId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const subalcance = await prisma.subscopes.findUnique({
      where: { id: subscopeId },
    });

    if (!subalcance) {
      return NextResponse.json(
        { error: "Subalcance no encontrado" },
        { status: 404 }
      );
    }

    const updatedSubalcance = await prisma.subscopes.update({
      where: { id: subscopeId },
      data: {
        isActive: !subalcance.isActive,
      },
    });

    return NextResponse.json(updatedSubalcance);
  } catch (error) {
    console.error("Error al actualizar el estado del subalcance:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado" },
      { status: 500 }
    );
  }
}
