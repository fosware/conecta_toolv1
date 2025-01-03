import { NextRequest, NextResponse } from "next/server";
import { menuItems } from "@/lib/menu";
import { jwtVerify } from "jose";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req: NextRequest) {
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

    const userId = payload.userId as number;

    // Obtener privilegios del usuario desde la base de datos
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            privileges: { include: { privilege: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const userPrivileges = user.role.privileges.map((rp) => rp.privilege.name);

    // Filtrar el menú según privilegios
    const filteredMenuItems = menuItems.filter((item) =>
      userPrivileges.includes(item.name)
    );

    return NextResponse.json(filteredMenuItems);
  } catch (error) {
    console.error("Error al procesar el menú:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
