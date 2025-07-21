import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token no proporcionado" }, { status: 401 });
    }

    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "active";
    const search = searchParams.get("search") || "";

    // Construir filtros para la consulta
    const whereClause: any = {
      isDeleted: status === "active" ? false : undefined,
    };

    // Agregar filtro de búsqueda si existe
    if (search) {
      const searchLower = search.toLowerCase();
      whereClause.OR = [
        {
          ProjectRequestCompany: {
            ProjectRequirements: {
              ProjectRequest: {
                title: {
                  contains: searchLower,
                  mode: 'insensitive'
                }
              }
            }
          }
        },
        {
          ProjectRequestCompany: {
            Company: {
              comercialName: {
                contains: searchLower,
                mode: 'insensitive'
              }
            }
          }
        }
      ];
    }

    // Primero obtener los projectRequestIds que tienen proyectos activos
    const activeProjects = await prisma.project.findMany({
      where: { isDeleted: false },
      select: {
        ProjectRequestCompany: {
          select: {
            ProjectRequirements: {
              select: {
                ProjectRequest: {
                  select: { id: true }
                }
              }
            }
          }
        }
      }
    });
    
    // Extraer IDs únicos de solicitudes que tienen proyectos
    const projectRequestIds = [...new Set(
      activeProjects.map(p => p.ProjectRequestCompany.ProjectRequirements.ProjectRequest.id)
    )];
    
    // Construir filtros para ProjectRequest
    const projectRequestWhere: any = {
      id: { in: projectRequestIds },
      isDeleted: false,
      isActive: true,
      // Filtro de búsqueda en título si existe
      ...(search && {
        title: {
          contains: search,
          mode: 'insensitive'
        }
      })
    };
    
    // Obtener solicitudes que llegaron a proyecto con toda su estructura
    const [allProjectRequests, totalItems] = await Promise.all([
      prisma.projectRequest.findMany({
        where: projectRequestWhere,
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
      }),
      prisma.projectRequest.count({ where: projectRequestWhere })
    ]);

    // Aplicar paginación directamente
    const startIndex = (page - 1) * limit;
    const projectRequests = allProjectRequests.slice(startIndex, startIndex + limit);

    // Transformar ProjectRequests a formato compatible con el frontend
    const projectsWithTitle = projectRequests.map((projectRequest: any) => {
      // Calcular estado general del proyecto basado en sus requerimientos
      let overallStatus = 'Pendiente';
      let hasActiveProjects = false;
      
      // Revisar todos los requerimientos y sus proyectos
      projectRequest.ProjectRequirements?.forEach((requirement: any) => {
        requirement.ProjectRequestCompany?.forEach((company: any) => {
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

    const actualTotalItems = allProjectRequests.length;
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
