import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id } = params;
    const associateId = parseInt(id);

    if (isNaN(associateId)) {
      return NextResponse.json(
        { error: "ID de asociado inválido" },
        { status: 400 }
      );
    }

    // Verificar que el asociado exista
    const associate = await prisma.associate.findFirst({
      where: {
        id: associateId,
        isDeleted: false,
      },
    });

    if (!associate) {
      return NextResponse.json(
        { error: "Asociado no encontrado" },
        { status: 404 }
      );
    }

    // Cambiar el estado del asociado
    const updatedAssociate = await prisma.associate.update({
      where: {
        id: associateId,
      },
      data: {
        isActive: !associate.isActive,
      },
    });

    return NextResponse.json({
      message: "Estado actualizado correctamente",
      isActive: updatedAssociate.isActive,
    });
  } catch (error) {
    console.error("Error al cambiar estado del asociado:", error);
    return NextResponse.json(
      { error: "Error al cambiar el estado del asociado" },
      { status: 500 }
    );
  }
}
