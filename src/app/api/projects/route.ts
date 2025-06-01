import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

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
    
    // Obtener el rol del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const isStaff = user.role.name === "staff";
    const isAsociado = user.role.name === "asociado";

    // Construir la consulta base
    let query: any = {
      where: {
        isDeleted: !active,
      },
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
              include: {
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

    // Si es asociado, solo mostrar sus proyectos
    if (isAsociado) {
      // Obtener la compañía del asociado
      const associatedCompany = await prisma.company.findFirst({
        where: {
          userId: userId,
          isActive: true,
          isDeleted: false,
        },
      });

      if (!associatedCompany) {
        return NextResponse.json({ error: "Compañía no encontrada" }, { status: 404 });
      }

      // Filtrar por proyectos donde la compañía del asociado está involucrada
      query.where.ProjectRequestCompany = {
        Company: {
          id: associatedCompany.id,
        },
      };
    }

    // Ejecutar la consulta
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
    
    // Devolver los proyectos enriquecidos
    return NextResponse.json(enrichedProjects);
  } catch (error) {
    console.error("Error al obtener proyectos:", error);
    return NextResponse.json(
      { error: "Error al obtener proyectos" },
      { status: 500 }
    );
  }
}
