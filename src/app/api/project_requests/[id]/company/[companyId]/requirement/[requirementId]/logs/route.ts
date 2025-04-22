import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; companyId: string; requirementId: string }> } 
) {
  try {
    // Extraer los IDs correctamente según Next.js 14/15
    const { id, companyId, requirementId } = await params;
    const parsedProjectId = parseInt(id);
    const parsedCompanyId = parseInt(companyId);
    const parsedRequirementId = parseInt(requirementId);

    // Obtener parámetros de consulta para paginación
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "30"); // Por defecto 30 mensajes
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Validar los IDs
    if (isNaN(parsedProjectId) || isNaN(parsedCompanyId) || isNaN(parsedRequirementId)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // PASO 1: Verificar que el requerimiento pertenece al proyecto
    const requirement = await prisma.projectRequirements.findFirst({
      where: {
        id: parsedRequirementId,
        projectRequestId: parsedProjectId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!requirement) {
      return NextResponse.json(
        { error: "El requerimiento no pertenece al proyecto especificado" },
        { status: 404 }
      );
    }

    // PASO 2: Buscar ESPECÍFICAMENTE la relación entre compañía y requerimiento
    const projectRequestCompany = await prisma.projectRequestCompany.findFirst({
      where: {
        projectRequirementsId: parsedRequirementId,
        companyId: parsedCompanyId,
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
            projectRequestId: true,
          },
        },
      },
    });

    if (!projectRequestCompany) {
      // PASO 2.1: Buscar todas las relaciones para esta compañía para depuración
      const allRelations = await prisma.projectRequestCompany.findMany({
        where: {
          companyId: parsedCompanyId,
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
      
      return NextResponse.json(
        { error: "Relación entre compañía y requerimiento no encontrada" },
        { status: 404 }
      );
    }

    // Obtener el total de mensajes para esta relación (para paginación)
    const totalLogs = await prisma.projectRequestCompanyStatusLog.count({
      where: {
        projectRequestCompanyId: projectRequestCompany.id,
        isActive: true,
        isDeleted: false,
      },
    });

    // PASO 3: Obtener SOLO los logs específicos de esta relación (con paginación)
    const logs = await prisma.projectRequestCompanyStatusLog.findMany({
      where: {
        projectRequestCompanyId: projectRequestCompany.id,
        isActive: true,
        isDeleted: false,
      },
      orderBy: {
        dateTimeMessage: "desc", // Ordenar por fecha descendente (más recientes primero)
      },
      take: limit,
      skip: skip,
      include: {
        user: {
          select: {
            email: true,
            username: true,
            profile: {
              select: {
                name: true,
              },
            },
          },
        },
        ProjectRequestCompany: {
          select: {
            id: true,
            Company: {
              select: {
                id: true,
                comercialName: true,
              },
            },
            ProjectRequirements: {
              select: {
                id: true,
                requirementName: true,
                projectRequestId: true,
              }
            }
          },
        },
      },
    });
    
    // PASO 4: Verificar que cada log realmente pertenece a esta relación específica
    const validatedLogs = logs.filter(log => {
      return log.projectRequestCompanyId === projectRequestCompany.id;
    });

    // PASO 5: Formatear la respuesta con información detallada
    const formattedLogs = validatedLogs.map((log) => {
      return {
        id: log.id,
        projectRequestCompanyId: log.projectRequestCompanyId,
        message: log.message,
        dateTimeMessage: log.dateTimeMessage,
        isActive: log.isActive,
        isDeleted: log.isDeleted,
        dateDeleted: log.dateDeleted,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
        userId: log.userId,
        userName: log.user?.username || "Usuario",
        userRole: log.user?.profile?.name || "Usuario",
        companyName: log.ProjectRequestCompany?.Company?.comercialName || "",
        requirementName: log.ProjectRequestCompany?.ProjectRequirements?.requirementName || "",
      };
    });

    // Incluir metadatos de paginación en la respuesta
    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        total: totalLogs,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalLogs / limit)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener logs específicos" },
      { status: 500 }
    );
  }
}
