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

    // Ahora buscamos el ProjectRequestCompany que coincida con alguno de estos requerimientos
    const projectRequestCompany = await prisma.projectRequestCompany.findFirst({
      where: {
        projectRequirementsId: {
          in: requirementIds
        },
        companyId: parsedCompanyId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!projectRequestCompany) {
      return NextResponse.json(
        { error: "Relación entre proyecto y compañía no encontrada" },
        { status: 404 }
      );
    }

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
      },
    });

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
