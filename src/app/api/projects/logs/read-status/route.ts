import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { getDateFromServer } from "@/lib/get-date-from-server";
import { z } from "zod";

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

    // Usamos una transacción para asegurar que todas las operaciones se ejecuten con la misma zona horaria
    await prisma.$transaction(async (tx) => {
      // Establecemos explícitamente la zona horaria para esta transacción
      // Esto asegura que NOW() devuelva la fecha y hora en la zona horaria de México
      await tx.$executeRawUnsafe(`SET TIME ZONE 'America/Mexico_City';`);

      // Verificamos la fecha actual para depuración
      const checkDate = await tx.$queryRaw<{ now: Date; now_tz: string }[]>`
        SELECT 
          NOW() as now,
          NOW()::text as now_tz
      `;
      console.log(
        "Fecha actual en PostgreSQL (America/Mexico_City):",
        checkDate[0].now
      );
      console.log("Fecha como texto con zona horaria:", checkDate[0].now_tz);

      // Procesamos cada log usando SQL directo para tener control total sobre todos los campos
      for (const log of unreadLogs) {
        // Usamos SQL directo con la zona horaria ya establecida
        await tx.$executeRaw`
          INSERT INTO "d_user_log_read_status_project" ("userId", "logId", "isRead", "readAt", "createdAt", "updatedAt")
          VALUES (${userId}, ${log.id}, true, NOW(), NOW(), NOW())
          ON CONFLICT ("userId", "logId") 
          DO UPDATE SET 
            "isRead" = true, 
            "readAt" = NOW(),
            "updatedAt" = NOW()
        `;
      }
    });

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
