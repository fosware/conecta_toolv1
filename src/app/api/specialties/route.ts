import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// GET: Obtener todas las especialidades
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken();

    const specialties = await prisma.specialties.findMany({
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
      data: specialties
    });
  } catch (error) {
    console.error("Error al obtener especialidades:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener especialidades" 
    }, { 
      status: 500 
    });
  }
}
