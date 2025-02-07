import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    // Validar el token y obtener el userId
    const adminId = await getUserFromToken();

    // Obtener y validar los parámetros
    const { id, userId } = await params;
    const companyId = parseInt(id);
    const targetUserId = parseInt(userId);
    
    if (isNaN(companyId) || isNaN(targetUserId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Obtener el estado actual del body
    const body = await request.json();
    const { isActive } = body;

    console.log('Toggle status request:', {
      companyId,
      targetUserId,
      newStatus: isActive
    });

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario pertenezca a la compañía
    const companyUser = await prisma.companyUser.findFirst({
      where: {
        companyId,
        userId: targetUserId,
        isDeleted: false,
      },
      include: {
        user: true
      }
    });

    console.log('Found company user:', companyUser);

    if (!companyUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado en la compañía" },
        { status: 404 }
      );
    }

    console.log('Updating user status:', {
      userId: targetUserId,
      currentStatus: companyUser.user.isActive,
      newStatus: isActive
    });

    // Actualizar el estado del usuario
    const updatedUser = await prisma.user.update({
      where: {
        id: targetUserId,
      },
      data: {
        isActive,
      },
      select: {
        id: true,
        email: true,
        username: true,
        isActive: true,
        profile: {
          select: {
            name: true,
            phone: true
          }
        }
      },
    });

    console.log('Updated user:', updatedUser);

    return NextResponse.json({ 
      data: updatedUser,
      message: "Estado actualizado correctamente" 
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado del usuario" },
      { status: 500 }
    );
  }
}
