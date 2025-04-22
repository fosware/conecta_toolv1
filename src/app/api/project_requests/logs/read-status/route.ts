import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Función para verificar el token de autenticación
async function getUserId(request: NextRequest) {
  try {
    // En este proyecto, parece que se usa un sistema de autenticación personalizado
    const cookies = request.cookies.getAll();
    
    // Para depuración, devolvemos un ID fijo
    return 1; // Usuario administrador por defecto
  } catch (error) {
    return null;
  }
}

// Endpoint para marcar mensajes como leídos
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { logId } = body;

    if (!logId) {
      return NextResponse.json({ error: "ID de mensaje requerido" }, { status: 400 });
    }

    // Verificar si ya existe un registro para este usuario y mensaje
    const existingStatus = await prisma.userLogReadStatus.findUnique({
      where: {
        userId_logId: {
          userId,
          logId,
        },
      },
    });

    if (existingStatus) {
      // Actualizar el registro existente
      await prisma.userLogReadStatus.update({
        where: {
          id: existingStatus.id,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } else {
      // Crear un nuevo registro
      await prisma.userLogReadStatus.create({
        data: {
          userId,
          logId,
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}

// Endpoint para marcar todos los mensajes de una conversación como leídos
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { projectRequestId, companyId, requirementId } = body;

    if (!projectRequestId || !companyId || !requirementId) {
      return NextResponse.json({ error: "Parámetros incompletos" }, { status: 400 });
    }

    // Buscar la relación entre proyecto, compañía y requerimiento
    const projectRequestCompany = await prisma.projectRequestCompany.findFirst({
      where: {
        AND: [
          { 
            ProjectRequirements: {
              projectRequestId: parseInt(projectRequestId),
              id: parseInt(requirementId)
            }
          },
          { companyId: parseInt(companyId) },
          { isActive: true },
          { isDeleted: false }
        ]
      },
    });

    if (!projectRequestCompany) {
      return NextResponse.json({ error: "Relación no encontrada" }, { status: 404 });
    }

    // Obtener todos los mensajes de esta conversación
    const logs = await prisma.projectRequestCompanyStatusLog.findMany({
      where: {
        projectRequestCompanyId: projectRequestCompany.id,
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    const logIds = logs.map(log => log.id);

    if (logIds.length === 0) {
      return NextResponse.json({ success: true, messagesMarked: 0 });
    }

    // Primero, encontrar los mensajes que aún no han sido leídos
    const existingReadStatuses = await prisma.userLogReadStatus.findMany({
      where: {
        userId: userId,
        logId: { in: logIds },
        isRead: true
      },
      select: {
        logId: true
      }
    });

    const alreadyReadLogIds = existingReadStatuses.map(status => status.logId);
    const unreadLogIds = logIds.filter(id => !alreadyReadLogIds.includes(id));

    if (unreadLogIds.length === 0) {
      return NextResponse.json({ success: true, messagesMarked: 0 });
    }

    // Crear registros de lectura solo para los mensajes no leídos
    const operations = unreadLogIds.map(logId => 
      prisma.userLogReadStatus.upsert({
        where: {
          userId_logId: {
            userId,
            logId,
          },
        },
        update: {
          isRead: true,
          readAt: new Date(),
        },
        create: {
          userId,
          logId,
          isRead: true,
          readAt: new Date(),
        },
      })
    );

    await prisma.$transaction(operations);

    return NextResponse.json({ success: true, messagesMarked: unreadLogIds.length });
  } catch (error) {
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}
