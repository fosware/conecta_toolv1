import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { projectRequestLogSchema } from "@/lib/schemas/project_request_log";

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
    const validationResult = projectRequestLogSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { message, projectRequestCompanyId } = validationResult.data;

    console.warn("⚠️ ADVERTENCIA: Usando endpoint general para crear logs sin especificar requerimiento");
    console.warn("⚠️ Se recomienda usar el endpoint: /api/project_requests/logs/create/with-requirement");

    // Verificar que la relación proyecto-compañía existe
    const projectRequestCompany = await prisma.projectRequestCompany.findUnique({
      where: {
        id: projectRequestCompanyId,
        isActive: true,
        isDeleted: false,
      },
      include: {
        Company: {
          select: {
            id: true,
            comercialName: true,
          },
        },
        ProjectRequirements: {
          select: {
            id: true,
            projectRequestId: true,
            requirementName: true,
          },
        },
      },
    });

    if (!projectRequestCompany) {
      return NextResponse.json(
        { error: "Relación entre proyecto y compañía no encontrada" },
        { status: 404 }
      );
    }

    // Mostrar información detallada para ayudar en la depuración
    // Se eliminaron los logs de depuración de relación usada

    // Crear el log
    const newLog = await prisma.projectRequestCompanyStatusLog.create({
      data: {
        message,
        projectRequestCompanyId,
        userId: userId,
        dateTimeMessage: new Date(),
      },
    });

    return NextResponse.json(
      {
        ...newLog,
        companyName: projectRequestCompany.Company?.comercialName,
        requirementName: projectRequestCompany.ProjectRequirements?.requirementName,
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
