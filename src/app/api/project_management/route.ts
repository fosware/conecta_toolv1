import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { PrismaClient } from "@prisma/client";

// Instancia local de Prisma para este endpoint específico
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "active";
    const search = searchParams.get("search") || "";

    // Obtener directamente las solicitudes de proyecto que tienen proyectos asociados
    const projectRequests = await prisma.projectRequest.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        // Solo solicitudes que tienen proyectos
        ProjectRequirements: {
          some: {
            ProjectRequestCompany: {
              some: {
                Project: {
                  some: {
                    isDeleted: false
                  }
                }
              }
            }
          }
        },
        // Filtro de búsqueda si existe
        ...(search && {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        })
      },
      include: {
        ProjectRequirements: {
          where: { isDeleted: false, isActive: true },
          include: {
            ProjectRequestCompany: {
              where: { isDeleted: false, isActive: true },
              include: {
                Company: true,
                Project: {
                  where: { isDeleted: false },
                  include: {
                    ProjectStatus: true,
                    ProjectStage: {
                      where: { isDeleted: false },
                      orderBy: { order: 'asc' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    // Contar total de elementos
    const totalItems = projectRequests.length;

    // Aplicar paginación directamente
    const startIndex = (page - 1) * limit;
    const paginatedProjectRequests = projectRequests.slice(startIndex, startIndex + limit);

    // Transformar ProjectRequests a formato compatible con el frontend
    const projectsWithTitle = paginatedProjectRequests.map((projectRequest) => {
      // Calcular estado general del proyecto basado en sus requerimientos
      let overallStatus = 'Pendiente';
      let hasActiveProjects = false;
      
      // Revisar todos los requerimientos y sus proyectos
      projectRequest.ProjectRequirements?.forEach((requirement) => {
        requirement.ProjectRequestCompany?.forEach((company) => {
          if (company.Project?.length > 0) {
            hasActiveProjects = true;
            // Aquí podrías agregar lógica más sofisticada para el estado
          }
        });
      });
      
      return {
        id: projectRequest.id,
        projectRequestId: projectRequest.id,
        projectStatusId: 1, // Estado por defecto
        projectRequestCompanyId: null,
        observations: projectRequest.observation,
        isDeleted: projectRequest.isDeleted,
        dateDeleted: projectRequest.dateDeleted,
        createdAt: projectRequest.createdAt,
        updatedAt: projectRequest.updatedAt,
        userId: projectRequest.userId,
        projectRequestTitle: projectRequest.title,
        // Datos adicionales para el frontend
        ProjectRequirements: projectRequest.ProjectRequirements,
        ProjectStatus: {
          id: 1,
          name: overallStatus,
          color: hasActiveProjects ? 'blue' : 'gray'
        }
      };
    });

    const actualTotalItems = projectRequests.length;
    const totalPages = Math.ceil(actualTotalItems / limit);

    return NextResponse.json({
      projects: projectsWithTitle,
      totalPages,
      totalItems: actualTotalItems,
      currentPage: page,
      itemsPerPage: limit,
    });

  } catch (error) {
    console.error("Error in project management API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
