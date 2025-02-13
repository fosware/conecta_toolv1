import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({ 
      where: { 
        id: parseInt(params.id),
        isDeleted: false
      } 
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: parseInt(params.id) },
      data: { 
        isDeleted: true, 
        dateDeleted: new Date(),
        isActive: false
      }
    });

    return NextResponse.json(
      { message: "Usuario eliminado exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario." },
      { status: 500 }
    );
  }
}
