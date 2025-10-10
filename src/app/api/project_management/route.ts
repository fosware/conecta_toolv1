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
  id: number;
  isDeleted: boolean;
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

    // OPTIMIZACIÓN: Extraer todos los project IDs para calcular progreso en una sola query
    const allProjectIds: number[] = [];
    paginatedProjectRequests.forEach((projectRequest: ProjectRequestData) => {
      projectRequest.ProjectRequirements?.forEach((requirement: RequirementWithCompanies) => {
        requirement.ProjectRequestCompany?.forEach((company: CompanyWithProjects) => {
          company.Project?.forEach((project: ProjectWithCategories) => {
            if (!project.isDeleted) {
              allProjectIds.push(project.id);
            }
          });
        });
      });
    });

    // OPTIMIZACIÓN: Calcular progreso de todos los proyectos en una sola query
    let projectsProgressMap = new Map<number, { progress: number, status: string }>();
    
    if (allProjectIds.length > 0) {
      try {
        // Obtener progreso promedio de etapas para cada proyecto
        const stagesProgress = await prisma.projectStage.groupBy({
          by: ['projectId'],
          where: {
            projectId: { in: allProjectIds },
            isDeleted: false
          },
          _avg: {
            progress: true
          }
        });

        // Mapear progreso y calcular estado
        stagesProgress.forEach((item: any) => {
          const progress = Math.round(item._avg.progress || 0);
          let status = 'Por iniciar';
          if (progress > 0 && progress < 100) {
            status = 'En progreso';
          } else if (progress === 100) {
            status = 'Completado';
          }
          projectsProgressMap.set(item.projectId, { progress, status });
        });
      } catch (error) {
        console.error('Error calculating projects progress:', error);
        // Continuar sin progreso si falla
      }
    }

    // Transformar ProjectRequests a formato compatible con el frontend
    const projectsWithTitle = paginatedProjectRequests.map((projectRequest: ProjectRequestData) => {
      // Calcular estado general del proyecto basado en sus requerimientos
      let overallStatus = 'Pendiente';
      let hasActiveProjects = false;
      
      // Calcular fechas de inicio y término basadas en actividades
      let projectStartDate: Date | null = null;
      let projectEndDate: Date | null = null;
      const allActivityDates: Date[] = [];
      
      // OPTIMIZACIÓN: Calcular progreso agregado de todos los proyectos del projectRequest
      const projectProgressValues: number[] = [];
      
      // Revisar todos los requerimientos y sus proyectos
      projectRequest.ProjectRequirements?.forEach((requirement: RequirementWithCompanies) => {
        requirement.ProjectRequestCompany?.forEach((company: CompanyWithProjects) => {
          if (company.Project?.length > 0) {
            hasActiveProjects = true;
            
            // Recopilar progreso de proyectos
            company.Project.forEach((project: ProjectWithCategories) => {
              const progressData = projectsProgressMap.get(project.id);
              if (progressData) {
                projectProgressValues.push(progressData.progress);
              }
              
              // Recopilar fechas de todas las actividades
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
      
      // OPTIMIZACIÓN: Calcular progreso promedio y estado para este projectRequest
      let calculatedProgress = 0;
      let calculatedStatus = 'Por iniciar';
      
      if (projectProgressValues.length > 0) {
        calculatedProgress = Math.round(
          projectProgressValues.reduce((sum, val) => sum + val, 0) / projectProgressValues.length
        );
        
        if (calculatedProgress > 0 && calculatedProgress < 100) {
          calculatedStatus = 'En progreso';
        } else if (calculatedProgress === 100) {
          calculatedStatus = 'Completado';
        }
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
        // OPTIMIZACIÓN: Progreso pre-calculado (evita N llamadas en frontend)
        calculatedProgress: calculatedProgress,
        calculatedStatus: calculatedStatus,
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
