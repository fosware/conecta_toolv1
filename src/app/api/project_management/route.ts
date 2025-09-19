import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { PrismaClient } from "@prisma/client";

// Instancia local de Prisma para este endpoint específico
const prisma = new PrismaClient();

// Tipos para actividades con fechas
type ActivityWithDates = {
  dateTentativeStart: Date | null;
  dateTentativeEnd: Date | null;
};

// Tipos para la estructura anidada
type CategoryWithActivities = {
  ProjectCategoryActivity: ActivityWithDates[];
};

type ProjectWithCategories = {
  ProjectCategory: CategoryWithActivities[];
};

type CompanyWithProjects = {
  Project: ProjectWithCategories[];
};

type RequirementWithCompanies = {
  ProjectRequestCompany: CompanyWithProjects[];
};

type ProjectRequestData = {
  id: number;
  title: string;
  observation: string | null;
  isDeleted: boolean;
  dateDeleted: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  ProjectRequirements: RequirementWithCompanies[];
};

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
          select: {
            id: true,
            requirementName: true,
            piecesNumber: true,
            observation: true,
            priority: true,
            createdAt: true,
            updatedAt: true,
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
                    },
                    // Incluir categorías y actividades para obtener fechas reales
                    ProjectCategory: {
                      where: { isDeleted: false },
                      include: {
                        ProjectCategoryActivity: {
                          where: { isDeleted: false },
                          select: {
                            dateTentativeStart: true,
                            dateTentativeEnd: true
                          }
                        }
                      }
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
    const projectsWithTitle = paginatedProjectRequests.map((projectRequest: ProjectRequestData) => {
      // Calcular estado general del proyecto basado en sus requerimientos
      let overallStatus = 'Pendiente';
      let hasActiveProjects = false;
      
      // Calcular fechas de inicio y término basadas en actividades
      let projectStartDate: Date | null = null;
      let projectEndDate: Date | null = null;
      const allActivityDates: Date[] = [];
      
      // Revisar todos los requerimientos y sus proyectos
      projectRequest.ProjectRequirements?.forEach((requirement: RequirementWithCompanies) => {
        requirement.ProjectRequestCompany?.forEach((company: CompanyWithProjects) => {
          if (company.Project?.length > 0) {
            hasActiveProjects = true;
            
            // Recopilar fechas de todas las actividades de todos los proyectos
            company.Project.forEach((project: ProjectWithCategories) => {
              project.ProjectCategory?.forEach((category: CategoryWithActivities) => {
                category.ProjectCategoryActivity?.forEach((activity: ActivityWithDates) => {
                  if (activity.dateTentativeStart) {
                    allActivityDates.push(new Date(activity.dateTentativeStart));
                  }
                  if (activity.dateTentativeEnd) {
                    allActivityDates.push(new Date(activity.dateTentativeEnd));
                  }
                });
              });
            });
          }
        });
      });
      
      // Calcular fechas mínima y máxima
      if (allActivityDates.length > 0) {
        projectStartDate = new Date(Math.min(...allActivityDates.map(d => d.getTime())));
        projectEndDate = new Date(Math.max(...allActivityDates.map(d => d.getTime())));
      }
      
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
        // Nuevas fechas basadas en actividades
        projectStartDate: projectStartDate,
        projectEndDate: projectEndDate,
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
