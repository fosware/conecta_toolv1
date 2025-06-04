import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { getDateFromServer } from "@/lib/get-date-from-server";
import { z } from "zod";

// Función para obtener la fecha actual en la zona horaria de México
function getCurrentDateInMexicoCity() {
  // Crear una fecha en UTC
  const now = new Date();

  // Convertir a la zona horaria de México (UTC-6)
  const mexicoCityDate = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Mexico_City" })
  );

  return mexicoCityDate;
}

// Esquema de validación para marcar logs como leídos
const readStatusSchema = z.object({
  projectId: z.number().int().positive("ID de proyecto inválido"),
});

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener datos del cuerpo de la solicitud
    const body = await request.json();

    // Validar datos con el esquema
    const validationResult = readStatusSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { projectId } = validationResult.data;

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

    // Obtener todos los logs no leídos para este usuario y proyecto
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

    // Si no hay logs no leídos, retornar
    if (unreadLogs.length === 0) {
      return NextResponse.json({
        messagesMarked: 0,
        message: "No hay mensajes nuevos para marcar como leídos",
      });
    }

    // Obtener la fecha actual del servidor PostgreSQL
    const serverDate = await getDateFromServer();
    console.log("Fecha del servidor PostgreSQL:", serverDate);
    
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

    return NextResponse.json({
      messagesMarked: unreadLogs.length,
      message: `${unreadLogs.length} mensajes marcados como leídos`,
    });
  } catch (error) {
    console.error("Error al marcar logs como leídos:", error);
    return NextResponse.json(
      { error: "Error al marcar logs como leídos" },
      { status: 500 }
    );
  }
}
