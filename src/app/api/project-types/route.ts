import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Verificar autenticación mediante el token en los headers
    const headersList = await headers();
    const authorization = headersList.get("authorization");
    
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener tipos de proyecto activos
    const projectTypes = await prisma.projectTypes.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      items: projectTypes,
    });
  } catch (error) {
    console.error("Error al obtener tipos de proyecto:", error);
    return NextResponse.json(
      { error: "Error al obtener tipos de proyecto" },
      { status: 500 }
    );
  }
}
