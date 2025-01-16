import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: Request, context: { params: { id: string } }) {
  try {
    const certificationId = parseInt(
      await Promise.resolve(context.params.id),
      10
    );
    if (isNaN(certificationId)) {
      return NextResponse.json(
        { message: "ID de certificación inválido." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const userId = formData.get("userId") as string;

    // Validar datos requeridos
    if (!name || !description || !userId) {
      return NextResponse.json(
        { message: "Faltan datos requeridos." },
        { status: 400 }
      );
    }

    // Verificar si la certificación ya existe
    const existingCertification = await prisma.certifications.findFirst({
      where: { name },
    });

    if (existingCertification) {
      return NextResponse.json(
        { message: "La certificación ya existe." },
        { status: 400 }
      );
    }

    // Actualizar la certificación
    const updatedCertification = await prisma.certifications.update({
      where: { id: certificationId },
      data: { name, description, userId: parseInt(userId) },
      include: {
        user: true,
      },
    });

    return NextResponse.json(updatedCertification);
  } catch (error) {
    console.error("Error al actualizar certificación:", error);
    return NextResponse.json(
      { message: "Error al actualizar certificación." },
      { status: 500 }
    );
  }
}
