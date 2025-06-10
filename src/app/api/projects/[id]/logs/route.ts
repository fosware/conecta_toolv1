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
      orderBy: [
        // Ordenar primero por fecha de creación (más reciente primero)
        { createdAt: "desc" },
        // Luego por dateTimeMessage (más reciente primero)
        { dateTimeMessage: "desc" },
        // Finalmente por ID (más reciente primero)
        { id: "desc" }
      ],
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

    // Usamos una transacción para asegurar que todas las operaciones se ejecuten con la misma zona horaria
    await prisma.$transaction(async (tx) => {
      // Establecemos explícitamente la zona horaria para esta transacción
      // Esto asegura que NOW() devuelva la fecha y hora en la zona horaria de México
      await tx.$executeRawUnsafe(`SET TIME ZONE 'America/Mexico_City';`);
      
      // Verificamos la fecha actual para depuración
      const checkDate = await tx.$queryRaw<{now: Date, now_tz: string}[]>`
        SELECT 
          NOW() as now,
          NOW()::text as now_tz
      `;
      // Se eliminaron los console.logs de fechas
      
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
    // Se eliminó el console.error
    return NextResponse.json(
      { error: "Error al obtener logs" },
      { status: 500 }
    );
  }
}
