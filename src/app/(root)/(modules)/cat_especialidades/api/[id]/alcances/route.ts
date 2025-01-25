import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// Eliminar un alcance
export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params;
    
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
        { error: "ID de alcance no proporcionado o inválido" },
        { status: 400 }
      );
    }

    // Marcar como eliminado en lugar de eliminar físicamente
    const alcance = await prisma.scopes.update({
      where: {
        id: parseInt(id),
      },
      data: {
        isDeleted: true,
        userId,
      },
    });

    return NextResponse.json(alcance);
  } catch (error) {
    console.error("Error al eliminar alcance:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
