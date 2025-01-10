import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { profileSchema } from "@/lib/schemas/profile";
import { ZodError } from "zod";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req: NextRequest) {
  try {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET no está definido");
      return NextResponse.json(
        { message: "Error interno del servidor" },
        { status: 500 }
      );
    }

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { message: "Autenticación requerida" },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    const userId = Number(payload.userId);

    if (!userId) {
      return NextResponse.json(
        { message: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const name = formData.get("name") as string | null;
    const first_lastname = formData.get("first_lastname") as string | null;
    const second_lastname = formData.get("second_lastname") as string | null;
    const phone = formData.get("phone") as string | null;
    const email = formData.get("email") as string | null;
    const username = formData.get("username") as string | null;
    const password = formData.get("password") as string | null;
    const image = formData.get("image") as File | null;

    const parsedData = profileSchema.parse({
      name,
      first_lastname,
      second_lastname,
      phone,
      email,
      username,
      password,
      confirmPassword: password,
      image,
    });

    //unicidad
    // Validar unicidad de email y username
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: parsedData.email,
        id: { not: userId }, // Excluir al usuario actual
      },
    });

    const existingUsername = await prisma.user.findFirst({
      where: {
        username: parsedData.username,
        id: { not: userId }, // Excluir al usuario actual
      },
    });

    if (existingEmail) {
      return NextResponse.json(
        { message: "El correo ya está registrado por otro usuario." },
        { status: 400 }
      );
    }

    if (existingUsername) {
      return NextResponse.json(
        {
          message: "El nombre de usuario ya está registrado por otro usuario.",
        },
        { status: 400 }
      );
    }

    // Procesar la imagen (si existe) en formato Base64
    let base64Image: string | null = null;
    if (image) {
      try {
        const buffer = await image.arrayBuffer();
        base64Image = Buffer.from(buffer).toString("base64");
      } catch (error) {
        console.error("Error al procesar la imagen:", error);
        return NextResponse.json(
          { message: "Error procesando la imagen" },
          { status: 400 }
        );
      }
    } else {
      // Mantener la imagen existente si no se envía una nueva
      const existingProfile = await prisma.profile.findUnique({
        where: { userId },
        select: { image_profile: true },
      });
      base64Image = existingProfile?.image_profile || null;
    }

    let hashedPassword: string | null = null;
    if (parsedData.password) {
      const salt = bcrypt.genSaltSync(10);
      hashedPassword = bcrypt.hashSync(parsedData.password, salt);
    }

    await prisma.profile.upsert({
      where: { userId },
      update: {
        name: parsedData.name!,
        first_lastname: parsedData.first_lastname!,
        second_lastname: parsedData.second_lastname || null,
        phone: parsedData.phone || null,
        image_profile: base64Image,
      },
      create: {
        name: parsedData.name!,
        first_lastname: parsedData.first_lastname!,
        second_lastname: parsedData.second_lastname || null,
        phone: parsedData.phone || null,
        image_profile: base64Image,
        user: { connect: { id: userId } },
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        email: parsedData.email!,
        username: parsedData.username!,
        ...(hashedPassword && { password: hashedPassword }),
      },
    });
    /*
    return NextResponse.json(
      { message: "Perfil actualizado correctamente" },
      { status: 200 }
    );
    */
    return NextResponse.json(
      {
        message: "Perfil actualizado correctamente",
        profile: {
          name: parsedData.name,
          first_lastname: parsedData.first_lastname,
          second_lastname: parsedData.second_lastname,
          phone: parsedData.phone,
          email: parsedData.email,
          username: parsedData.username,
          image_profile: base64Image, // Devuelve la imagen en base64 si existe
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Errores de validación:", error.flatten());
      return NextResponse.json(
        { message: "Error de validación", errors: error.flatten() },
        { status: 400 }
      );
    }

    console.error("Error en la actualización del perfil:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
