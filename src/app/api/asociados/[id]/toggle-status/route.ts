import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id } = await params;
    const associateId = parseInt(id);

    if (isNaN(associateId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Obtener el estado actual del asociado
    const associate = await prisma.associate.findUnique({
      where: { id: associateId, userId },
      select: {
        id: true,
        companyName: true,
        isActive: true,
        isDeleted: true,
      },
    });

    if (!associate) {
      return NextResponse.json(
        { error: "Asociado no encontrado" },
        { status: 404 }
      );
    }

    if (associate.isDeleted) {
      return NextResponse.json(
        { error: "Asociado eliminado" },
        { status: 404 }
      );
    }

    // Actualizar el estado
    const updatedAssociate = await prisma.associate.update({
      where: { id: associateId, userId },
      data: {
        isActive: !associate.isActive,
      },
      select: {
        id: true,
        companyName: true,
        isActive: true,
      },
    });

    return NextResponse.json(updatedAssociate);
  } catch (error) {
    console.error("Error al cambiar estado del asociado:", error);
    return NextResponse.json(
      { error: "Error al cambiar el estado del asociado" },
      { status: 500 }
    );
  }
}
