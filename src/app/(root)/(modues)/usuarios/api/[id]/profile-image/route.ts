import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, context: { params: { id: string } }) {
  try {
    // Esperar a que los `params` sean procesados correctamente
    const { id } = await context.params;

    // Procesar el ID del usuario
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { message: "ID de usuario inválido" },
        { status: 400 }
      );
    }

    // Buscar al usuario y su perfil en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el perfil tiene una imagen asociada
    if (!user.profile?.image_profile) {
      console.warn(`Usuario ${userId} no tiene imagen de perfil.`);
      return NextResponse.json(
        { message: "Imagen de perfil no encontrada" },
        { status: 404 }
      );
    }

    // Convertir la imagen de Base64 a binario
    const imageBuffer = Buffer.from(user.profile.image_profile, "base64");

    // Responder con la imagen
    return new Response(imageBuffer, {
      headers: { "Content-Type": "image/png" },
    });
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
