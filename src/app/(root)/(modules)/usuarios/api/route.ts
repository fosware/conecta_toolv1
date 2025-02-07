import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email";

const prisma = new PrismaClient();

/*
type FormDataEntries = {
  email: string;
  password: string;
  username: string;
  roleId: string;
  name: string;
  first_lastname: string;
  second_lastname?: string;
  phone?: string;
  image_profile?: string;
};
*/
// Obtener lista de usuarios con paginación, filtros y búsqueda
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    const searchTerm = searchParams.get("search") || "";
    const onlyActive = searchParams.get("onlyActive") === "true";

    const where: Prisma.UserWhereInput = {
      isDeleted: false,
      isActive: onlyActive || undefined,
      OR: searchTerm
        ? [
            { email: { contains: searchTerm, mode: "insensitive" } },
            { username: { contains: searchTerm, mode: "insensitive" } },
            {
              profile: {
                name: { contains: searchTerm, mode: "insensitive" },
              },
            },
            { role: { name: { contains: searchTerm, mode: "insensitive" } } },
          ]
        : undefined,
    };

    const total = await prisma.user.count({ where });
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const skip = (currentPage - 1) * limit;

    const usuarios = await prisma.user.findMany({
      where,
      include: {
        profile: {
          select: {
            name: true,
            first_lastname: true,
            second_lastname: true,
            phone: true,
          },
        },
        role: {
          select: {
            name: true,
            id: true,
          },
        },
      },
      skip,
      take: limit,
    });

    const formattedUsuarios = usuarios.map((usuario) => ({
      id: usuario.id,
      email: usuario.email,
      username: usuario.username,
      isActive: usuario.isActive,
      profile: usuario.profile,
      role: usuario.role,
    }));

    return NextResponse.json({
      usuarios: formattedUsuarios,
      total,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { message: "Error al obtener usuarios." },
      { status: 500 }
    );
  }
}

/// Crear un nuevo usuario
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const email = formData.get("email") as string | null;
    const password = formData.get("password") as string | null;
    const username = formData.get("username") as string | null;
    const roleId = formData.get("roleId") as string | null;
    const name = formData.get("name") as string | null;
    const first_lastname = formData.get("first_lastname") as string | null;
    const second_lastname = formData.get("second_lastname") as string | null;
    const phone = formData.get("phone") as string | null;
    const imageFile = formData.get("image_profile") as File | null;

    // Validar datos requeridos
    if (
      !email ||
      !password ||
      !username ||
      !roleId ||
      !name ||
      !first_lastname
    ) {
      return NextResponse.json(
        { message: "Faltan datos requeridos." },
        { status: 400 }
      );
    }
    const existingUserWithEmail = await prisma.user.findFirst({
      where: { 
        email,
        isDeleted: false // Solo buscar en usuarios no eliminados
      },
    });

    if (existingUserWithEmail) {
      return NextResponse.json(
        { message: "El correo ya está en uso." },
        { status: 400 }
      );
    }

    const existingUserWithUsername = await prisma.user.findFirst({
      where: { 
        username,
        isDeleted: false // Solo buscar en usuarios no eliminados
      },
    });

    if (existingUserWithUsername) {
      return NextResponse.json(
        { message: "El nombre de usuario ya está en uso." },
        { status: 400 }
      );
    }

    // Procesar la imagen (si existe)
    let imageBase64: string | null = null;
    if (imageFile) {
      const buffer = await imageFile.arrayBuffer();
      imageBase64 = Buffer.from(buffer).toString("base64");
    }

    // Hashear la contraseña
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Crear el usuario y el perfil relacionado
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        roleId: parseInt(roleId, 10),
        mustChangePassword: true,
        profile: {
          create: {
            name,
            first_lastname,
            second_lastname: second_lastname || null,
            phone: phone || null,
            image_profile: imageBase64,
          },
        },
      },
      include: {
        profile: true,
        role: true,
      },
    });

    // Enviar correo de bienvenida con las credenciales
    try {
      await sendWelcomeEmail({
        to: email,
        username,
        password, // Enviamos la contraseña sin hashear
        name,
      });
    } catch (emailError) {
      console.error("Error al enviar correo de bienvenida:", emailError);
      // No devolvemos error al cliente si falla el correo, solo lo registramos
    }

    return NextResponse.json(newUser);
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return NextResponse.json(
      { message: "Error al crear usuario." },
      { status: 500 }
    );
  }
}

// Eliminar (lógica) un usuario
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: "ID del usuario es requerido." },
        { status: 400 }
      );
    }

    const deletedUser = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: { isDeleted: true, dateDeleted: new Date() },
    });

    return NextResponse.json(deletedUser);
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { message: "Error al eliminar usuario." },
      { status: 500 }
    );
  }
}

// Soporte adicional para PATCH para eliminar usuarios
export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // Obtener el ID de la URL

    if (!id) {
      return NextResponse.json(
        { message: "ID del usuario es requerido." },
        { status: 400 }
      );
    }

    const deletedUser = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: { isDeleted: true, dateDeleted: new Date() },
    });

    return NextResponse.json(deletedUser);
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { message: "Error al eliminar usuario." },
      { status: 500 }
    );
  }
}
