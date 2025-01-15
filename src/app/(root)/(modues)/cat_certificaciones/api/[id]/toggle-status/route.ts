import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const certificacion = await prisma.certifications.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!certificacion) {
      return NextResponse.json(
        { error: "Certificación no encontrada." },
        { status: 404 }
      );
    }

    const updatedCertification = await prisma.certifications.update({
      where: { id: parseInt(id, 10) },
      data: { isActive: !certificacion.isActive },
    });
    return NextResponse.json(updatedCertification);
  } catch (error) {
    console.error("Error al actualizar el estado de la certificación:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado de la certificación." },
      { status: 500 }
    );
  }
}
