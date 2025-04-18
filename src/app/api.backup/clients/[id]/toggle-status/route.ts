import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromToken();
    const { id } = await context.params;
    const clientId = parseInt(id);

    const client = await prisma.clients.findUnique({
      where: { id: clientId },
      select: { isActive: true, isDeleted: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    if (client.isDeleted) {
      return NextResponse.json(
        { error: "No se puede modificar el estado de un cliente eliminado" },
        { status: 400 }
      );
    }

    const updatedClient = await prisma.clients.update({
      where: { id: clientId },
      data: {
        isActive: !client.isActive,
        userId,
      },
    });

    return NextResponse.json({
      message: `Cliente ${updatedClient.isActive ? "activado" : "desactivado"} correctamente`,
      client: updatedClient,
    });
  } catch (error) {
    console.error("Error al actualizar estado del cliente:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar el estado del cliente",
      },
      { status: 500 }
    );
  }
}
