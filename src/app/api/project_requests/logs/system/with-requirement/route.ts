import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { z } from "zod";

// Esquema específico para logs del sistema con requerimiento
const systemLogWithRequirementSchema = z.object({
  message: z.string().min(1, "El mensaje es requerido"),
  projectRequestId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  requirementId: z.number().int().positive(),
  userId: z.number().int().positive().optional(),
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
    const validationResult = systemLogWithRequirementSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { message, projectRequestId, companyId, requirementId, userId: specificUserId } = validationResult.data;
    const userIdToUse = specificUserId || userId;

    // Se eliminó el log de depuración de creación de log del sistema

    // Buscar ESPECÍFICAMENTE la relación entre proyecto, compañía y requerimiento
    const projectRequestCompany = await prisma.projectRequestCompany.findFirst({
      where: {
        projectRequirementsId: requirementId,
        companyId: companyId,
        isActive: true,
        isDeleted: false,
      },
      include: {
        Company: {
          select: {
            comercialName: true,
          },
        },
        ProjectRequirements: {
          select: {
            requirementName: true,
          },
        },
      },
    });

    if (!projectRequestCompany) {
      console.error(`Relación no encontrada para Proyecto=${projectRequestId}, Compañía=${companyId}, Requerimiento=${requirementId}`);
      return NextResponse.json(
        { error: "Relación entre proyecto, compañía y requerimiento no encontrada" },
        { status: 404 }
      );
    }

    // Se eliminó el log de depuración de relación encontrada

    // Formatear el mensaje del sistema
    const formattedMessage = message.startsWith("[SISTEMA]") ? message : `[SISTEMA] ${message}`;

    // Crear el log
    const newLog = await prisma.projectRequestCompanyStatusLog.create({
      data: {
        message: formattedMessage,
        projectRequestCompanyId: projectRequestCompany.id,
        userId: userIdToUse,
        dateTimeMessage: new Date(),
      },
    });

    // Se eliminó el log de depuración de log del sistema creado

    return NextResponse.json(
      {
        id: newLog.id,
        message: newLog.message,
        projectRequestCompanyId: newLog.projectRequestCompanyId,
        dateTimeMessage: newLog.dateTimeMessage,
        requirementName: projectRequestCompany.ProjectRequirements.requirementName,
        companyName: projectRequestCompany.Company.comercialName,
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear log del sistema con requerimiento específico:", error);
    return NextResponse.json(
      { error: "Error al crear log del sistema con requerimiento específico" },
      { status: 500 }
    );
  }
}
