import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    // Verificar autenticación
    const currentUserId = await getUserFromToken();
    const { id, userId } = await params;

    const companyId = parseInt(id);
    const targetUserId = parseInt(userId);

    if (isNaN(companyId) || isNaN(targetUserId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Verificar si existe la relación usuario-empresa
    const companyUser = await prisma.companyUser.findFirst({
      where: {
        companyId,
        userId: targetUserId,
        isDeleted: false,
      },
      include: {
        user: true,
      },
    });

    if (!companyUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado en la empresa" },
        { status: 404 }
      );
    }

    // Actualizar el estado del usuario
    const updatedUser = await prisma.user.update({
      where: {
        id: targetUserId,
      },
      data: {
        isActive: !companyUser.user.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      isActive: updatedUser.isActive,
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al cambiar el estado del usuario" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
