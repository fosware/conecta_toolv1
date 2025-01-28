import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const associate = await prisma.associate.findUnique({
      where: { id, userId },
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

    const updated = await prisma.associate.update({
      where: { id, userId },
      data: {
        isActive: !associate.isActive,
      },
      select: {
        id: true,
        companyName: true,
        isActive: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error toggling associate status:", error);
    return NextResponse.json(
      { error: "Error al cambiar el estado del asociado" },
      { status: 500 }
    );
  }
}
