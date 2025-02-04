import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const certificationId = parseInt(id, 10);

    if (isNaN(certificationId)) {
      return NextResponse.json(
        { message: "ID de certificación inválido." },
        { status: 400 }
      );
    }

    const jsonData = await req.json();
    const { name, description, userId } = jsonData;

    // Validar datos requeridos
    if (!name || !userId) {
      return NextResponse.json(
        { message: "El nombre y el ID del usuario son requeridos." },
        { status: 400 }
      );
    }

    // Verificar si la certificación existe
    const existingCertification = await prisma.certifications.findUnique({
      where: { id: certificationId },
    });

    if (!existingCertification) {
      return NextResponse.json(
        { message: "La certificación no existe." },
        { status: 404 }
      );
    }

    // Verificar si el nombre ya existe en otra certificación
    const duplicateCertification = await prisma.certifications.findFirst({
      where: {
        name,
        id: { not: certificationId }, // Excluir la certificación actual
      },
    });

    if (duplicateCertification) {
      return NextResponse.json(
        { message: "Ya existe una certificación con ese nombre." },
        { status: 400 }
      );
    }

    // Actualizar la certificación
    const updatedCertification = await prisma.certifications.update({
      where: { id: certificationId },
      data: {
        name,
        description,
        userId: parseInt(userId, 10),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedCertification);
  } catch {
    return NextResponse.json(
      { message: "Error al actualizar la certificación." },
      { status: 500 }
    );
  }
}
