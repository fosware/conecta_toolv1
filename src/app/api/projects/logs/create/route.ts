import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { z } from "zod";

// Esquema de validación para los logs de proyectos
const projectLogSchema = z.object({
  message: z.string().min(1, "El mensaje es requerido"),
  projectId: z.number().int().positive("ID de proyecto inválido")
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
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
    
    const { message, projectId } = validationResult.data;

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

    // Crear el log
    const newLog = await prisma.projectLog.create({
      data: {
        message,
        projectId,
        userId,
        dateTimeMessage: new Date(),
        isRead: false,
      },
    });
    
    // Obtener información del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        role: true,
      },
    });

    return NextResponse.json(
      {
        ...newLog,
        userName: user?.profile?.name || user?.username,
        userRole: user?.role?.name,
        companyName: project?.ProjectRequestCompany?.Company?.comercialName,
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear log:", error);
    return NextResponse.json(
      { error: "Error al crear log" },
      { status: 500 }
    );
  }
}
