import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { PrismaClient } from "@prisma/client";

// Instancia local de Prisma para este endpoint específico
const prisma = new PrismaClient();

// OPTIMIZACIÓN: Tipos simplificados - solo traemos IDs
type ProjectSimple = {
  id: number;
  isDeleted: boolean;
};

type CompanyWithProjects = {
  Project: ProjectSimple[];
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
                Company: {
                  select: {
                    id: true,
                    companyName: true,
                    comercialName: true
                  }
                },
                Project: {
                  where: { isDeleted: false },
                  select: {
                    id: true,
                    isDeleted: true,
                    // OPTIMIZACIÓN: Solo traer IDs, no incluir categories ni activities
                    // Las fechas se calcularán cuando se necesiten
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
          company.Project?.forEach((project: ProjectSimple) => {
            if (!project.isDeleted) {
              allProjectIds.push(project.id);
            }
          });
        });
      });
    });

    // OPTIMIZACIÓN: Obtener fechas de actividades SOLO de proyectos paginados
    let projectDatesMap = new Map<number, { startDate: Date | null, endDate: Date | null }>();
    
    if (allProjectIds.length > 0) {
      const activitiesWithDates = await prisma.projectCategoryActivity.findMany({
        where: {
          ProjectCategory: {
            projectId: { in: allProjectIds },
            isDeleted: false
          },
          isDeleted: false
        },
        select: {
          dateTentativeStart: true,
          dateTentativeEnd: true,
          ProjectCategory: {
            select: {
              projectId: true
            }
          }
        }
      });

      // Agrupar fechas por proyecto (filtrar las que tengan fechas)
      const projectDates = new Map<number, Date[]>();
      activitiesWithDates.forEach((activity: any) => {
        // Solo procesar si tiene al menos una fecha
        if (!activity.dateTentativeStart && !activity.dateTentativeEnd) return;
        
        const projectId = activity.ProjectCategory.projectId;
        if (!projectDates.has(projectId)) {
          projectDates.set(projectId, []);
        }
        if (activity.dateTentativeStart) {
          projectDates.get(projectId)!.push(new Date(activity.dateTentativeStart));
        }
        if (activity.dateTentativeEnd) {
          projectDates.get(projectId)!.push(new Date(activity.dateTentativeEnd));
        }
      });

      // Calcular fecha min y max por proyecto
      projectDates.forEach((dates, projectId) => {
        if (dates.length > 0) {
          const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
          const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
          projectDatesMap.set(projectId, { startDate, endDate });
        }
      });
    }

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
        console.error('❌ [API] Error calculating projects progress:', error);
        // Continuar sin progreso si falla
      }
    }

    // Transformar ProjectRequests a formato compatible con el frontend
    const projectsWithTitle = paginatedProjectRequests.map((projectRequest: ProjectRequestData) => {
      // Calcular estado general del proyecto basado en sus requerimientos
      let overallStatus = 'Pendiente';
      let hasActiveProjects = false;
      
      // OPTIMIZACIÓN: Calcular progreso agregado de todos los proyectos del projectRequest
      const projectProgressValues: number[] = [];
      const allProjectDates: Date[] = [];
      
      // Revisar todos los requerimientos y sus proyectos
      projectRequest.ProjectRequirements?.forEach((requirement: RequirementWithCompanies) => {
        requirement.ProjectRequestCompany?.forEach((company: CompanyWithProjects) => {
          if (company.Project?.length > 0) {
            hasActiveProjects = true;
            
            // Recopilar progreso y fechas de proyectos
            company.Project.forEach((project: ProjectSimple) => {
              const progressData = projectsProgressMap.get(project.id);
              if (progressData) {
                projectProgressValues.push(progressData.progress);
              }
              
              // Recopilar fechas del proyecto
              const datesData = projectDatesMap.get(project.id);
              if (datesData) {
                if (datesData.startDate) allProjectDates.push(datesData.startDate);
                if (datesData.endDate) allProjectDates.push(datesData.endDate);
              }
            });
          }
        });
      });
      
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
      
      // OPTIMIZACIÓN: Calcular fechas mínima y máxima del projectRequest
      let projectStartDate: Date | null = null;
      let projectEndDate: Date | null = null;
      
      if (allProjectDates.length > 0) {
        projectStartDate = new Date(Math.min(...allProjectDates.map(d => d.getTime())));
        projectEndDate = new Date(Math.max(...allProjectDates.map(d => d.getTime())));
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
        // OPTIMIZACIÓN: Fechas calculadas eficientemente (solo proyectos paginados)
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
