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
    const userId = params.id;
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

    // Verificar si el email ya existe
    const existingUserWithEmail = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: parseInt(userId, 10)
        }
      }
    });

    if (existingUserWithEmail) {
      return NextResponse.json(
        { message: "El correo electrónico ya está siendo utilizado por otro usuario" },
        { status: 400 }
      );
    }

    // Verificar si el username ya existe
    const existingUserWithUsername = await prisma.user.findFirst({
      where: {
        username,
        NOT: {
          id: parseInt(userId, 10)
        }
      }
    });

    if (existingUserWithUsername) {
      return NextResponse.json(
        { message: "El nombre de usuario ya está siendo utilizado" },
        { status: 400 }
      );
    }

    // Actualizar usuario
    await prisma.user.update({
      where: { id: parseInt(userId, 10) },
      data: {
        email,
        username,
        roleId: parseInt(roleId, 10),
        ...(password && { password: await bcrypt.hash(password, 10) }),
      },
    });

    // Actualizar o crear perfil
    const profile = await prisma.profile.upsert({
      where: { userId: parseInt(userId, 10) },
      create: {
        name,
        first_lastname,
        second_lastname,
        phone,
        image_profile: base64Image,
        userId: parseInt(userId, 10),
      },
      update: {
        name,
        first_lastname,
        second_lastname,
        phone,
        ...(base64Image && { image_profile: base64Image }),
      },
    });

    return NextResponse.json({
      id: userId,
      email,
      username,
      roleId,
      name: profile.name,
      first_lastname: profile.first_lastname,
      second_lastname: profile.second_lastname,
      phone: profile.phone,
      image_profile: profile.image_profile,
    });
  } catch (error) {
    console.error("Error al actualizar el usuario:", error);
    
    // Mejorar el manejo de errores de Prisma
    if (error.code === 'P2002') {
      const field = error.meta?.target[0];
      const message = field === 'email' 
        ? "El correo electrónico ya está siendo utilizado"
        : field === 'username'
        ? "El nombre de usuario ya está siendo utilizado"
        : "Error de validación en los datos";
      
      return NextResponse.json({ message }, { status: 400 });
    }
    
    return NextResponse.json(
      { message: "Error al actualizar el usuario" },
      { status: 500 }
    );
  }
}
