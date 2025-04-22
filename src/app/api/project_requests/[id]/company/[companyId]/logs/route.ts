import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; companyId: string }> } 
) {
  try {
    // Extraer los IDs correctamente según Next.js 15
    const { id, companyId } = await params;
    const parsedProjectId = parseInt(id);
    const parsedCompanyId = parseInt(companyId);

    console.log(`ADVERTENCIA: Usando endpoint general sin requerimiento específico. Proyecto=${parsedProjectId}, Compañía=${parsedCompanyId}`);
    console.log(`Se recomienda usar el endpoint con requerimiento específico: /api/project_requests/${parsedProjectId}/company/${parsedCompanyId}/requirement/[requirementId]/logs`);

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Buscar el ProjectRequestCompany
    // Primero, obtenemos los requerimientos del proyecto
    const projectRequirements = await prisma.projectRequirements.findMany({
      where: {
        projectRequestId: parsedProjectId,
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true
      }
    });

    // Extraemos los IDs de los requerimientos
    const requirementIds = projectRequirements.map(req => req.id);
    console.log(`Requerimientos encontrados para el proyecto: ${requirementIds.join(', ')}`);

    // Ahora buscamos el ProjectRequestCompany que coincida con alguno de estos requerimientos
    const projectRequestCompanies = await prisma.projectRequestCompany.findMany({
      where: {
        projectRequirementsId: {
          in: requirementIds
        },
        companyId: parsedCompanyId,
        isActive: true,
        isDeleted: false,
      },
      include: {
        ProjectRequirements: {
          select: {
            requirementName: true
          }
        }
      }
    });

    if (!projectRequestCompanies || projectRequestCompanies.length === 0) {
      console.error("No se encontraron relaciones entre proyecto y compañía");
      return NextResponse.json(
        { error: "Relación entre proyecto y compañía no encontrada" },
        { status: 404 }
      );
    }

    console.log(`Se encontraron ${projectRequestCompanies.length} relaciones para esta compañía en diferentes requerimientos:`);
    projectRequestCompanies.forEach(prc => {
      console.log(`- ID: ${prc.id}, Requerimiento: ${prc.ProjectRequirements.requirementName}`);
    });

    // ADVERTENCIA: Estamos tomando solo la primera relación, lo que puede no ser lo que el usuario espera
    const projectRequestCompany = projectRequestCompanies[0];
    console.log(`ADVERTENCIA: Se usará solo la primera relación encontrada (ID: ${projectRequestCompany.id}, Requerimiento: ${projectRequestCompany.ProjectRequirements.requirementName})`);

    // Obtener los logs específicos de esta relación proyecto-compañía
    const logs = await prisma.projectRequestCompanyStatusLog.findMany({
      where: {
        projectRequestCompanyId: projectRequestCompany.id,
        isActive: true,
        isDeleted: false,
      },
      orderBy: {
        dateTimeMessage: "desc",
      },
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
            Company: {
              select: {
                comercialName: true,
              },
            },
            ProjectRequirements: {
              select: {
                requirementName: true,
              }
            }
          },
        },
      },
    });

    console.log(`Encontrados ${logs.length} logs para la relación seleccionada`);

    // Formatear la respuesta para incluir nombres de usuario y roles
    const formattedLogs = logs.map((log) => ({
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
    }));

    return NextResponse.json(formattedLogs);
  } catch (error) {
    console.error("Error al obtener logs de compañía:", error);
    return NextResponse.json(
      { error: "Error al obtener logs de compañía" },
      { status: 500 }
    );
  }
}
