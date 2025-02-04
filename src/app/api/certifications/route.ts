import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// GET: Obtener todas las certificaciones
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken();

    const items = await prisma.certifications.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al obtener certificaciones" },
      { status: 500 }
    );
  }
}
