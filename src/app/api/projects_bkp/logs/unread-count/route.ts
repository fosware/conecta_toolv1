import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener el ID del proyecto de los parámetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const projectIdParam = searchParams.get("projectId");
    
    if (!projectIdParam) {
      return NextResponse.json(
        { error: "ID de proyecto requerido" },
        { status: 400 }
      );
    }
    
    const projectId = parseInt(projectIdParam);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "ID de proyecto inválido" },
        { status: 400 }
      );
    }

    // Verificar que el proyecto existe
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        isDeleted: false,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Contar los logs no leídos para este usuario y proyecto
    const unreadCount = await prisma.projectLog.count({
      where: {
        projectId: projectId,
        UserLogReadStatusProject: {
          none: {
            userId: userId,
            isRead: true,
          },
        },
      },
    });

    return NextResponse.json({
      unreadCount,
      projectId,
    });
  } catch (error) {
    console.error("Error al obtener conteo de mensajes no leídos:", error);
    return NextResponse.json(
      { error: "Error al obtener conteo de mensajes no leídos" },
      { status: 500 }
    );
  }
}
