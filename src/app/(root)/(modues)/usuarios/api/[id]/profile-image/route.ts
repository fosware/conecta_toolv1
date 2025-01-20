import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Buscar el perfil del usuario
    const profile = await prisma.profile.findUnique({
      where: { userId: parseInt(id) },
    });

    if (!profile) {
      console.warn(`Usuario ${id} no tiene perfil.`);
      return NextResponse.json(
        { message: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si hay imagen de perfil
    if (!profile.image_profile) {
      console.warn(`Usuario ${id} no tiene imagen de perfil.`);
      return NextResponse.json(
        { message: "Imagen de perfil no encontrada" },
        { status: 404 }
      );
    }

    // Convertir la imagen de Base64 a binario
    const imageBuffer = Buffer.from(profile.image_profile, "base64");

    // Responder con la imagen
    return new Response(imageBuffer, {
      headers: { "Content-Type": "image/jpeg" }, // o "image/png" según el formato de tu imagen
    });
  } catch (error) {
    console.error("Error al obtener la imagen de perfil:", error);
    return NextResponse.json(
      { message: "Error al obtener la imagen de perfil" },
      { status: 500 }
    );
  }
}
