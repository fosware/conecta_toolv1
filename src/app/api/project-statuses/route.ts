import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// GET para obtener todos los estados de proyecto
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener todos los estados de proyecto
    const projectStatuses = await prisma.projectStatus.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json(projectStatuses);
  } catch (error) {
    console.error("Error al obtener estados de proyecto:", error);
    return NextResponse.json(
      { error: "Error al obtener estados de proyecto" },
      { status: 500 }
    );
  }
}
