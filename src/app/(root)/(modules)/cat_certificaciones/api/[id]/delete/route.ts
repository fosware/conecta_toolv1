import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const certificationId = parseInt(id, 10);

    if (isNaN(certificationId)) {
      return NextResponse.json(
        { message: "ID de certificación inválido." },
        { status: 400 }
      );
    }

    const deletedCertification = await prisma.certifications.findUnique({
      where: { id: certificationId },
    });

    if (!deletedCertification) {
      return NextResponse.json(
        { message: "Certificación no encontrada." },
        { status: 404 }
      );
    }

    await prisma.certifications.update({
      where: { id: certificationId },
      data: { isDeleted: true, dateDeleted: new Date() },
    });

    return NextResponse.json({ message: "Certificación eliminada" });
  } catch {
    return NextResponse.json(
      { message: "Error al eliminar certificación." },
      { status: 500 }
    );
  }
}
