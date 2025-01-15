import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const deletedCertification = await prisma.certifications.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!deletedCertification) {
      return NextResponse.json(
        { message: "Certificación no encontrada." },
        { status: 404 }
      );
    }

    await prisma.certifications.update({
      where: { id: parseInt(id, 10) },
      data: { isDeleted: true, dateDeleted: new Date() },
    });

    return NextResponse.json({ message: "Certificación eliminada" });
  } catch (error) {
    console.error("Error al eliminar certificación:", error);
    return NextResponse.json(
      { message: "Error al eliminar certificación." },
      { status: 500 }
    );
  }
}
