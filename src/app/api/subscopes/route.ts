import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// GET: Obtener todos los subalcances
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const subscopes = await prisma.subscopes.findMany({
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
      items: subscopes
    });
  } catch (error) {
    console.error("Error al obtener subalcances:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener subalcances" 
    }, { 
      status: 500 
    });
  }
}
