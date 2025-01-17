import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolver el parámetro dinámico id
    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { message: "ID de usuario inválido." },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    const email = formData.get("email") as string | null;
    const username = formData.get("username") as string | null;
    const roleId = formData.get("roleId") as string | null;
    const name = formData.get("name") as string | null;
    const first_lastname = formData.get("first_lastname") as string | null;
    const second_lastname = formData.get("second_lastname") as string | null;
    const phone = formData.get("phone") as string | null;
    const password = formData.get("password") as string | null;
    const image = formData.get("image_profile") as File | null;

    if (!email || !username || !roleId || !name || !first_lastname) {
      return NextResponse.json(
        { message: "Faltan datos requeridos." },
        { status: 400 }
      );
    }

    // Validar si el correo o el username están en uso por otro usuario
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { username: { equals: username, mode: "insensitive" } },
        ],
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      const field =
        existingUser.email === email ? "correo" : "nombre de usuario";
      return NextResponse.json(
        { message: `El ${field} ya está en uso por otro usuario.` },
        { status: 400 }
      );
    }

    let base64Image: string | null = null;
    if (image) {
      try {
        const buffer = await image.arrayBuffer();
        base64Image = Buffer.from(buffer).toString("base64");
      } catch (error) {
        console.error("Error al procesar la imagen:", error);
        return NextResponse.json(
          { message: "Error procesando la imagen." },
          { status: 400 }
        );
      }
    } else {
      const existingProfile = await prisma.profile.findUnique({
        where: { userId },
        select: { image_profile: true },
      });
      base64Image = existingProfile?.image_profile || null;
    }

    const hashedPassword = password ? bcrypt.hashSync(password, 10) : undefined;

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
            image_profile: base64Image,
          },
        },
      },
      include: { profile: true, role: true },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error al procesar PATCH:", error);
    return NextResponse.json(
      { message: "Error al actualizar usuario." },
      { status: 500 }
    );
  }
}
