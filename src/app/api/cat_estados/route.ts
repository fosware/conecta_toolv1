import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET() {
  try {
    // Verificar autenticación
    try {
      await getUserFromToken();
    } catch {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const states = await prisma.locationState.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        country: true
      }
    });
    
    return NextResponse.json({ items: states });
  } catch (error) {
    console.error("Error al obtener estados:", error);
    return NextResponse.json(
      { error: "Error al obtener los estados" },
      { status: 500 }
    );
  }
}
