import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No estás autenticado" },
        { status: 401 }
      );
    }

    const certification = await prisma.certifications.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!certification) {
      return NextResponse.json(
        { error: "Certificación no encontrada" },
        { status: 404 }
      );
    }

    const updatedCertification = await prisma.certifications.update({
      where: { id: parseInt(params.id) },
      data: { isActive: !certification.isActive },
    });

    return NextResponse.json(updatedCertification, { status: 200 });
  } catch (error) {
    console.error("Error al cambiar estado de certificación:", error);
    return NextResponse.json(
      { error: "Error al cambiar estado de certificación" },
      { status: 500 }
    );
  }
}
