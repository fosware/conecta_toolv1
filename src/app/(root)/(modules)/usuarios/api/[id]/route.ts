import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const { id } = await params;
    let base64Image = null;

    // Extraer campos del formData
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const username = formData.get("username") as string;
    const first_lastname = formData.get("first_lastname") as string;
    const second_lastname = formData.get("second_lastname") as string | null;
    const phone = formData.get("phone") as string | null;
    const roleId = formData.get("roleId") as string;
    const password = formData.get("password") as string | null;
    const image = formData.get("image_profile") as File | null;

    // Procesar la imagen si existe
    if (image && image instanceof File) {
      try {
        const arrayBuffer = await image.arrayBuffer();
        base64Image = Buffer.from(arrayBuffer).toString("base64");
      } catch (error) {
        console.error("Error al procesar la imagen:", error);
        return NextResponse.json(
          { message: "Error al procesar la imagen" },
          { status: 400 }
        );
      }
    }

    try {
      // Actualizar usuario
      await prisma.user.update({
        where: { id: parseInt(id, 10) },
        data: {
          email,
          username,
          roleId: parseInt(roleId, 10),
          ...(password && { password: await bcrypt.hash(password, 10) }),
        },
      });

      // Actualizar o crear perfil
      const profile = await prisma.profile.upsert({
        where: { userId: parseInt(id, 10) },
        create: {
          name,
          first_lastname,
          second_lastname,
          phone,
          image_profile: base64Image,
          userId: parseInt(id, 10),
        },
        update: {
          name,
          first_lastname,
          second_lastname,
          phone,
          ...(base64Image && { image_profile: base64Image }),
        },
      });

      return NextResponse.json(
        { message: "Usuario actualizado exitosamente" },
        { status: 200 }
      );
    } catch (error) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { message: "El correo electrónico o nombre de usuario ya está siendo utilizado por otro usuario activo" },
          { status: 400 }
        );
      }
      
      console.error("Error al actualizar usuario:", error);
      return NextResponse.json(
        { message: "Error al actualizar el usuario" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}
