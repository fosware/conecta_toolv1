import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { z } from "zod";

// Esquema específico para logs con requerimiento
const projectRequestLogWithRequirementSchema = z.object({
  message: z.string().min(1, "El mensaje es requerido"),
  projectRequestId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  requirementId: z.number().int().positive(),
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
    const validationResult = projectRequestLogWithRequirementSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { message, projectRequestId, companyId, requirementId } = validationResult.data;

    console.log(`[DEPURACIÓN AVANZADA] Creando log con requerimiento específico: Proyecto=${projectRequestId}, Compañía=${companyId}, Requerimiento=${requirementId}`);

    // PASO 1: Verificar que el requerimiento pertenece al proyecto
    const requirement = await prisma.projectRequirements.findFirst({
      where: {
        id: requirementId,
        projectRequestId: projectRequestId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!requirement) {
      console.error(`[DEPURACIÓN] El requerimiento ${requirementId} no pertenece al proyecto ${projectRequestId}`);
      return NextResponse.json(
        { error: "El requerimiento no pertenece al proyecto especificado" },
        { status: 404 }
      );
    }

    console.log(`[DEPURACIÓN] Requerimiento verificado: ID=${requirement.id}, Nombre=${requirement.requirementName}`);

    // PASO 2: Buscar ESPECÍFICAMENTE la relación entre compañía y requerimiento
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
      console.error(`[DEPURACIÓN] Relación no encontrada entre compañía ${companyId} y requerimiento ${requirementId}`);
      
      // PASO 2.1: Buscar todas las relaciones para esta compañía para depuración
      const allRelations = await prisma.projectRequestCompany.findMany({
        where: {
          companyId: companyId,
          isActive: true,
          isDeleted: false,
        },
        include: {
          ProjectRequirements: {
            select: {
              id: true,
              requirementName: true,
              projectRequestId: true,
            },
          },
        },
      });
      
      console.log(`[DEPURACIÓN] Se encontraron ${allRelations.length} relaciones para la compañía ${companyId}:`);
      allRelations.forEach(rel => {
        console.log(`- ID: ${rel.id}, Requerimiento: ${rel.ProjectRequirements.requirementName} (ID: ${rel.ProjectRequirements.id}), Proyecto: ${rel.ProjectRequirements.projectRequestId}`);
      });
      
      return NextResponse.json(
        { error: "Relación entre compañía y requerimiento no encontrada" },
        { status: 404 }
      );
    }

    console.log(`[DEPURACIÓN] Relación encontrada con ID: ${projectRequestCompany.id}, Compañía=${projectRequestCompany.Company.comercialName}, Requerimiento=${projectRequestCompany.ProjectRequirements.requirementName}`);

    // PASO 3: Crear el log con la relación específica
    const newLog = await prisma.projectRequestCompanyStatusLog.create({
      data: {
        message,
        projectRequestCompanyId: projectRequestCompany.id,
        userId: userId,
        dateTimeMessage: new Date(),
      },
    });

    console.log(`[DEPURACIÓN] Log creado con ID: ${newLog.id} para la relación específica ID=${projectRequestCompany.id}`);

    // PASO 4: Verificar que el log se creó correctamente
    const createdLog = await prisma.projectRequestCompanyStatusLog.findUnique({
      where: {
        id: newLog.id,
      },
      include: {
        ProjectRequestCompany: {
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
        },
      },
    });

    if (!createdLog) {
      console.error(`[DEPURACIÓN] No se pudo verificar el log creado con ID: ${newLog.id}`);
      return NextResponse.json(
        { error: "Error al verificar el log creado" },
        { status: 500 }
      );
    }

    console.log(`[DEPURACIÓN] Verificación exitosa del log ID: ${createdLog.id}`);
    console.log(`[DEPURACIÓN] - Relación: ${createdLog.projectRequestCompanyId}`);
    console.log(`[DEPURACIÓN] - Compañía: ${createdLog.ProjectRequestCompany.Company.comercialName}`);
    console.log(`[DEPURACIÓN] - Requerimiento: ${createdLog.ProjectRequestCompany.ProjectRequirements.requirementName}`);

    return NextResponse.json(
      {
        id: newLog.id,
        message: newLog.message,
        projectRequestCompanyId: newLog.projectRequestCompanyId,
        dateTimeMessage: newLog.dateTimeMessage,
        requirementName: projectRequestCompany.ProjectRequirements.requirementName,
        companyName: projectRequestCompany.Company.comercialName,
        _debug: {
          relationId: projectRequestCompany.id,
          companyId,
          requirementId,
        }
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error("[DEPURACIÓN] Error al crear log con requerimiento específico:", error);
    return NextResponse.json(
      { error: "Error al crear log con requerimiento específico" },
      { status: 500 }
    );
  }
}
