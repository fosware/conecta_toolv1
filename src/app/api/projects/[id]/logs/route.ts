import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { getDateFromServer } from "@/lib/get-date-from-server";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener y esperar los parámetros de ruta
    const params = await context.params;
    const projectId = parseInt(params.id);
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

    // Obtener los logs del proyecto
    const logs = await prisma.projectLog.findMany({
      where: {
        projectId: projectId,
      },
      orderBy: {
        dateTimeMessage: "desc",
      },
      include: {
        user: true,
        Project: true,
      },
    });

    // Marcar los logs como leídos para este usuario
    // Primero, obtener los IDs de los logs no leídos
    const unreadLogs = await prisma.projectLog.findMany({
      where: {
        projectId: projectId,
        UserLogReadStatusProject: {
          none: {
            userId: userId,
            isRead: true,
          },
        },
      },
      select: {
        id: true,
      },
    });

    // Obtener la fecha actual del servidor PostgreSQL
    const serverDate = await getDateFromServer();
    console.log("Fecha del servidor PostgreSQL (logs):", serverDate);
    
    // Actualizar registros de estado de lectura para cada log
    for (const log of unreadLogs) {
      await prisma.userLogReadStatusProject.upsert({
        where: {
          userId_logId: {
            userId,
            logId: log.id,
          },
        },
        update: {
          isRead: true,
          readAt: serverDate,
          updatedAt: serverDate, // Forzamos la fecha del servidor
        },
        create: {
          userId,
          logId: log.id,
          isRead: true,
          readAt: serverDate,
          createdAt: serverDate, // Forzamos la fecha del servidor
          updatedAt: serverDate, // Forzamos la fecha del servidor
        },
      });
    }

    // Formatear la respuesta
    const formattedLogs = logs.map((log) => {
      // Obtener el nombre de usuario y rol de manera segura
      let userName = null;
      let userRole = null;
      if (log.user) {
        userName = log.user.username; // Usando username en lugar de name
        userRole =
          log.user.roleId === 1
            ? "Administrador"
            : log.user.roleId === 2
              ? "Operador"
              : "Asociado";
      }

      // Obtener el nombre de la compañía de manera segura
      let companyName = null;
      if (log.Project && log.Project.projectRequestCompanyId) {
        // Aquí no podemos acceder directamente a company, así que lo dejamos como null
        // y se podría obtener en una consulta separada si es necesario
      }

      return {
        id: log.id,
        projectId: log.projectId,
        dateTimeMessage: log.dateTimeMessage,
        message: log.message,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
        userId: log.userId,
        userName,
        userRole,
        isSystemMessage: log.message.startsWith("[SISTEMA]"),
        companyName,
        categoryName: null, // Ajustado ya que no se incluye Category en la consulta
      };
    });

    return NextResponse.json({
      logs: formattedLogs,
      total: formattedLogs.length,
    });
  } catch (error) {
    console.error("Error al obtener logs:", error);
    return NextResponse.json(
      { error: "Error al obtener logs" },
      { status: 500 }
    );
  }
}
