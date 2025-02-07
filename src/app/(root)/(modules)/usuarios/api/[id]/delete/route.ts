import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: parseInt(id) },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    // Modificar el email antes de marcar como eliminado
    const timestamp = new Date().getTime();
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { 
        email: `${user.email}.deleted.${timestamp}@deleted.com`,
        username: `${user.username}.deleted.${timestamp}`,
        isDeleted: true, 
        dateDeleted: new Date() 
      },
      include: { profile: true }
    });

    return NextResponse.json({ 
      message: "Usuario eliminado",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: parseInt(id) },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    // Modificar el email antes de marcar como eliminado
    const timestamp = new Date().getTime();
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { 
        email: `${user.email}.deleted.${timestamp}@deleted.com`,
        username: `${user.username}.deleted.${timestamp}`,
        isDeleted: true, 
        dateDeleted: new Date() 
      },
      include: { profile: true }
    });

    return NextResponse.json({ 
      message: "Usuario eliminado",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario." },
      { status: 500 }
    );
  }
}
