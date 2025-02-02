import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(request: Request) {
  try {
    const userId = await getUserFromToken();

    // Obtener todos los certificados activos y no eliminados
    const certifications = await prisma.certifications.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(certifications);
  } catch (error) {
    console.error("Error detallado:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Error al obtener el catálogo de certificaciones",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: error instanceof Error && error.message === "No autorizado" ? 401 : 500 }
    );
  }
}
