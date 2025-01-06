import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function PATCH(req: Request, context: { params: { id: string } }) {
  try {
    console.log("Iniciando PATCH para usuario:", context.params.id);

    // Validar y procesar el parámetro dinámico
    const userId = parseInt(context.params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { message: "ID de usuario inválido." },
        { status: 400 }
      );
    }

    // Procesar datos del cuerpo de la solicitud
    const data = await req.json();
    const {
      email,
      username,
      roleId,
      name,
      first_lastname,
      second_lastname,
      phone,
      image_profile,
      password,
    } = data;

    // Validar campos requeridos
    if (!email || !username || !roleId || !name || !first_lastname) {
      return NextResponse.json(
        { message: "Faltan datos requeridos." },
        { status: 400 }
      );
    }

    const hashedPassword = password ? bcrypt.hashSync(password, 10) : undefined;

    // Actualizar el usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email,
        username,
        roleId: parseInt(roleId, 10),
        ...(hashedPassword && { password: hashedPassword }),
        profile: {
          update: {
            name,
            first_lastname,
            second_lastname: second_lastname || null,
            phone: phone || null,
            image_profile: image_profile || null,
          },
        },
      },
      include: { profile: true, role: true },
    });

    console.log("Usuario actualizado:", updatedUser);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error al procesar PATCH:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Datos mal formateados." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Error al actualizar usuario." },
      { status: 500 }
    );
  }
}
