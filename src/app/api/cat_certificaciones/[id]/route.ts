import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { handleRouteParams } from "@/lib/route-params";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const certificationId = parseInt(id);

    const body = await request.json();

    const name = body.name as string;
    const description = body.description as string;
    const userId = body.userId as string;

    // Verificar autenticación
    const cookieStore = await cookies();
    const token = await cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No estás autenticado" },
        { status: 401 }
      );
    }

    const certification = await prisma.certifications.update({
      where: {
        id: certificationId,
      },
      data: {
        name,
        description,
        user: {
          connect: {
            id: parseInt(userId),
          },
        },
      },
    });

    return NextResponse.json(certification, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar certificación:", error);
    return NextResponse.json(
      { error: "Error al actualizar certificación" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies();
    const token = await cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No estás autenticado" },
        { status: 401 }
      );
    }

    await prisma.certifications.update({
      where: {
        id: parseInt((await params).id),
      },
      data: {
        isDeleted: true,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar certificación:", error);
    return NextResponse.json(
      { error: "Error al eliminar certificación" },
      { status: 500 }
    );
  }
}
