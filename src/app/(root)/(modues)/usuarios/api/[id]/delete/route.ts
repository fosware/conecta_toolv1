import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isDeleted: true, dateDeleted: new Date() },
    });

    return NextResponse.json({ message: "Usuario eliminado lógicamente." });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario." },
      { status: 500 }
    );
  }
}
