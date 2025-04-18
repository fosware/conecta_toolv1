import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente según Next.js 15
    const routeParams = handleRouteParams(params);
const { id  } = routeParams;
    const projectRequestId = parseInt(id);

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el proyecto exista
    const projectRequest = await prisma.projectRequest.findUnique({
      where: {
        id: projectRequestId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!projectRequest) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Obtener todas las relaciones proyecto-compañía para este proyecto
    const projectCompanies = await prisma.projectRequestCompany.findMany({
      where: {
        ProjectRequirements: {
          projectRequestId: projectRequestId
        },
        isActive: true,
        isDeleted: false,
      },
      include: {
        Company: true, // Incluir toda la información de la compañía
      },
    });

    // Obtener los logs de todas las relaciones proyecto-compañía
    const logs = [];
    for (const company of projectCompanies) {
      const companyLogs = await prisma.projectRequestCompanyStatusLog.findMany({
        where: {
          projectRequestCompanyId: company.id,
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

      // Formatear los logs y añadir el nombre de la compañía
      const formattedLogs = companyLogs.map((log) => ({
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
        companyName: company.Company?.comercialName || "N/A",
        isSystemMessage: log.message.startsWith("[SISTEMA]"),
      }));

      logs.push(...formattedLogs);
    }

    // Ordenar todos los logs por fecha (más recientes primero)
    logs.sort(
      (a, b) => b.dateTimeMessage.getTime() - a.dateTimeMessage.getTime()
    );

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error al obtener logs del proyecto:", error);
    return NextResponse.json(
      { error: "Error al obtener logs del proyecto" },
      { status: 500 }
    );
  }
}
