import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromToken } from "@/lib/get-user-from-token";

// Instancia local de Prisma para este endpoint específico
const prisma = new PrismaClient();

// GET para obtener todos los proyectos
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active") !== "false"; // Por defecto muestra activos
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    
    // Calcular el offset para la paginación
    const skip = (page - 1) * limit;
    
    // Obtener el rol del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Normalizar nombres de roles para comparación (insensible a mayúsculas/minúsculas)
    const roleName = user.role.name.toLowerCase();
    const isStaff = roleName === "staff";
    const isAsociado = roleName === "asociado";
    const isAdmin = roleName === "admin" || roleName === "gerente";
    

    
    // Obtener la compañía del usuario si es Asociado o Staff
    let userCompanyId = null;
    if (isAsociado || isStaff) {
      const companyUser = await prisma.companyUser.findFirst({
        where: {
          userId: userId,
          isActive: true,
          isDeleted: false,
        },
        include: {
          company: true
        }
      });
      
      if (companyUser && companyUser.company) {
        userCompanyId = companyUser.company.id;
      }
    }

    // Construir la consulta base
    let query: any = {
      where: {
        isDeleted: !active,
      },
      
      // Añadir paginación
      skip,
      take: limit,
      include: {
        user: true,
        ProjectStatus: true,
        ProjectRequestCompany: {
          include: {
            Company: {
              select: {
                id: true,
                companyName: true,
                comercialName: true,
                contactName: true,
                email: true,
                phone: true,
                companyLogo: true,
                isActive: true,
                isDeleted: true
              }
            },
            ProjectRequirements: {
              select: {
                id: true,
                requirementName: true,
                ProjectRequest: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            }
          },
        },
      },
      orderBy: {
        createdAt: "desc" as const,
      },
    };

    // Si es asociado o staff, solo mostrar los proyectos de su empresa
    if ((isAsociado || isStaff) && userCompanyId) {
      // Filtrar por proyectos donde la compañía del usuario está involucrada
      query.where.ProjectRequestCompany = {
        companyId: userCompanyId,
      };
    } else if ((isAsociado || isStaff) && !userCompanyId) {
      // Si es asociado o staff pero no tiene empresa asignada, no mostrar proyectos
      return NextResponse.json({
        items: [],
        total: 0,
        totalPages: 0,
        currentPage: page
      }); // Devolver array vacío con metadatos de paginación
    }
    
    // Añadir filtro de búsqueda si se proporciona
    if (search) {
      // Buscar en ProjectRequestCompany -> Company -> nombre
      // y en ProjectRequestCompany -> ProjectRequirements -> ProjectRequest -> title
      query.where.OR = [
        {
          ProjectRequestCompany: {
            Company: {
              OR: [
                { companyName: { contains: search, mode: 'insensitive' } },
                { comercialName: { contains: search, mode: 'insensitive' } }
              ]
            }
          }
        },
        {
          ProjectRequestCompany: {
            ProjectRequirements: {
              some: {
                ProjectRequest: {
                  title: { contains: search, mode: 'insensitive' }
                }
              }
            }
          }
        }
      ];
    }

    // LÓGICA ESPECIAL PARA ADMIN: Agrupar por projectRequestId
    if (isAdmin) {
      // Para admin, obtenemos todos los proyectos y los agrupamos por projectRequestId
      const projects = await prisma.project.findMany({
        where: query.where,
        include: {
          user: true,
          ProjectStatus: true,
          ProjectRequestCompany: {
            include: {
              Company: {
                select: {
                  id: true,
                  companyName: true,
                  comercialName: true,
                  contactName: true,
                  email: true,
                  phone: true,
                  companyLogo: true,
                  isActive: true,
                  isDeleted: true
                }
              },
              ProjectRequirements: {
                select: {
                  id: true,
                  requirementName: true,
                  ProjectRequest: {
                    select: {
                      id: true,
                      title: true
                    }
                  }
                }
              }
            },
          },
        },
        orderBy: {
          createdAt: "desc" as const,
        },
      });

      // Agrupar proyectos por projectRequestId
      const groupedProjects = new Map();
      
      // Enriquecer proyectos con títulos reales
      const enrichedProjects = await Promise.all(
        projects.map(async (project) => {
          // Obtener la solicitud de proyecto directamente
          const projectRequest = await prisma.projectRequest.findFirst({
            where: {
              ProjectRequirements: {
                some: {
                  ProjectRequestCompany: {
                    some: {
                      id: project.projectRequestCompanyId
                    }
                  }
                }
              }
            },
            select: {
              id: true,
              title: true
            }
          });
          
          return {
            ...project,
            projectRequestTitle: projectRequest?.title || "Sin título"
          };
        })
      );
      
      for (const project of enrichedProjects) {
        // Usar el projectRequestId directo del modelo Project
        const projectRequestId = project.projectRequestId;
        const projectTitle = project.projectRequestTitle;
        

        
        if (projectRequestId) {
          if (!groupedProjects.has(projectRequestId)) {
            groupedProjects.set(projectRequestId, {
              id: projectRequestId, // Usar projectRequestId como ID principal
              projectRequestTitle: projectTitle,
              projectRequestId: projectRequestId,
              asociados: [],
              createdAt: project.createdAt, // Usar fecha del primer proyecto
              updatedAt: project.updatedAt
            });
          }
          
          // Agregar este proyecto como un asociado
          groupedProjects.get(projectRequestId).asociados.push({
            ...project,
            projectRequestTitle: projectTitle
          });
        }
      }
      
      // Convertir Map a Array y aplicar paginación
      const groupedArray = Array.from(groupedProjects.values());
      
      // Aplicar búsqueda si se proporciona
      let filteredGroups = groupedArray;
      if (search) {
        filteredGroups = groupedArray.filter(group => 
          group.projectRequestTitle.toLowerCase().includes(search.toLowerCase()) ||
          group.asociados.some((asociado: any) => 
            asociado.ProjectRequestCompany?.Company?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
            asociado.ProjectRequestCompany?.Company?.comercialName?.toLowerCase().includes(search.toLowerCase())
          )
        );
      }
      
      // Calcular paginación
      const totalCount = filteredGroups.length;
      const totalPages = Math.ceil(totalCount / limit);
      const paginatedGroups = filteredGroups.slice(skip, skip + limit);
      
      return NextResponse.json({
        items: paginatedGroups,
        total: totalCount,
        totalPages,
        currentPage: page
      });
    }
    
    // LÓGICA ORIGINAL PARA ASOCIADO/STAFF
    // Contar el total de registros para la paginación
    const totalCount = await prisma.project.count({
      where: query.where
    });
    
    // Calcular el total de páginas
    const totalPages = Math.ceil(totalCount / limit);
    
    // Ejecutar la consulta principal con paginación
    const projects = await prisma.project.findMany(query);
    
    // Enriquecer los datos con información adicional
    const enrichedProjects = await Promise.all(
      projects.map(async (project) => {
        // Obtener la solicitud de proyecto directamente
        const projectRequest = await prisma.projectRequest.findFirst({
          where: {
            ProjectRequirements: {
              some: {
                ProjectRequestCompany: {
                  some: {
                    id: project.projectRequestCompanyId
                  }
                }
              }
            }
          },
          select: {
            id: true,
            title: true
          }
        });
        
        return {
          ...project,
          projectRequestTitle: projectRequest?.title || "Sin título"
        };
      })
    );
    
    // Devolver los proyectos enriquecidos con metadatos de paginación
    return NextResponse.json({
      items: enrichedProjects,
      total: totalCount,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error("Error al obtener proyectos:", error);
    return NextResponse.json(
      { error: "Error al obtener proyectos" },
      { status: 500 }
    );
  }
}
