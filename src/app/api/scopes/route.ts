import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// GET: Obtener todos los alcances
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const scopes = await prisma.scopes.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      items: scopes
    });
  } catch (error) {
    console.error("Error al obtener alcances:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener alcances" 
    }, { 
      status: 500 
    });
  }
}
