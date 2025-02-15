import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { message: "Token no encontrado" },
        { status: 401 }
      );
    }

    if (!JWT_SECRET) {
      console.error("JWT_SECRET no está definido");
      return NextResponse.json(
        { message: "Error interno del servidor" },
        { status: 500 }
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        profile: true, 
        role: { select: { name: true } },
        CompanyUser: {
          where: { isDeleted: false },
          select: { companyId: true }
        }
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        email: user.email,
        username: user.username,
        role: user.role?.name || "",
        CompanyUser: user.CompanyUser || []
      },
      profile: {
        name: user.profile?.name || "",
        first_lastname: user.profile?.first_lastname || "",
        second_lastname: user.profile?.second_lastname || "",
        phone: user.profile?.phone || "",
        image_profile: user.profile?.image_profile || null,
      },
    });
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
