import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { z } from "zod";
import { getCurrentDateInMexicoCity, createDateForDatabaseInMexicoTime } from "@/lib/date-utils";

// Esquema de validación para los logs de proyectos
const projectLogSchema = z.object({
  message: z.string().min(1, "El mensaje es requerido"),
  projectId: z.number().int().positive("El ID del proyecto debe ser un número positivo"),
  categoryId: z.number().int().positive().optional(),
  dateTimeMessage: z.string().optional(), // Fecha explícita en formato ISO
  preventDuplicates: z.boolean().optional(), // Indica si se debe verificar duplicados
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener datos del cuerpo de la solicitud
    const body = await request.json();

    // Validar datos con el esquema
    const validationResult = projectLogSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { message, projectId, dateTimeMessage: providedDateTimeMessage, preventDuplicates } = validationResult.data;

    // Verificar que el proyecto existe
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        isDeleted: false,
      },
      include: {
        ProjectRequestCompany: {
          include: {
            Company: {
              select: {
                id: true,
                comercialName: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Determinar la fecha a usar
    let mexicoCityDate;
    
    if (providedDateTimeMessage) {
      // Si se proporciona una fecha explícita, convertirla a la zona horaria de México
      // usando PostgreSQL para asegurar consistencia
      const dateResult = await prisma.$queryRaw`
        SELECT ${ providedDateTimeMessage }::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City' as date
      `;
      mexicoCityDate = (dateResult as any)[0].date;
      // Se eliminó el console.log de fecha
    } else {
      // Si no se proporciona fecha, obtener la fecha actual en zona horaria de México
      const currentDateResult = await prisma.$queryRaw`SELECT NOW() AT TIME ZONE 'America/Mexico_City' as now`;
      mexicoCityDate = (currentDateResult as any)[0].now;
      // Se eliminó el console.log de fecha actual
    }
    
    // Obtener información del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        role: true,
      },
    });
    
    // No verificamos duplicados aquí, ya que queremos registrar cada acción individual
    // Si el frontend envía múltiples logs, es porque ocurrieron múltiples acciones
    
    // Crear el log usando Prisma con la fecha obtenida directamente de PostgreSQL
    const newLog = await prisma.projectLog.create({
      data: {
        projectId,
        userId,
        message,
        dateTimeMessage: mexicoCityDate,
        isRead: false,
        createdAt: mexicoCityDate, // Establecer createdAt explícitamente
        updatedAt: mexicoCityDate, // Establecer updatedAt explícitamente
      }
    });
    
    // Obtener el log recién creado
    const finalLog = await prisma.projectLog.findUnique({
      where: { id: newLog.id }
    });
    
    if (!finalLog) {
      return NextResponse.json({ error: "Error al crear log" }, { status: 500 });
    }
    
    // Se eliminaron los console.logs de información del log creado

    // Asegurarnos de que finalLog no sea undefined (ya verificado anteriormente)
    if (!finalLog) {
      return NextResponse.json({ error: "Error al crear log" }, { status: 500 });
    }
    
    // Crear la respuesta con los datos del log y la información adicional
    return NextResponse.json(
      {
        id: finalLog.id,
        message: finalLog.message,
        projectId: finalLog.projectId,
        userId: finalLog.userId,
        dateTimeMessage: finalLog.dateTimeMessage,
        isRead: finalLog.isRead,
        createdAt: finalLog.createdAt,
        updatedAt: finalLog.updatedAt,
        // Información adicional
        userName: user?.profile?.name || user?.username,
        userRole: user?.role?.name,
        companyName: project?.ProjectRequestCompany?.Company?.comercialName,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear log:", error);
    return NextResponse.json({ error: "Error al crear log" }, { status: 500 });
  }
}
