import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const userId = parseInt(id);

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error al actualizar el estado del usuario:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado del usuario." },
      { status: 500 }
    );
  }
}
