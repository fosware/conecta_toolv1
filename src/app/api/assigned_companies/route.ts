import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const onlyActive = searchParams.get("onlyActive") === "true";
    
    // En un entorno real, filtraríamos por la compañía del usuario asociado
    // Por ahora, para desarrollo, mostraremos todas las asignaciones
    const companyId = parseInt(searchParams.get("companyId") || "0");

    // Construir el filtro base
    const baseFilter: any = {
      isDeleted: false,
    };

    // Aplicar filtro de activo si es necesario
    if (onlyActive) {
      baseFilter.isActive = true;
    }

    // Aplicar filtro de compañía si se proporciona
    if (companyId > 0) {
      baseFilter.companyId = companyId;
    }

    // Obtener las solicitudes asignadas
    const items = await prisma.projectRequestCompany.findMany({
      where: baseFilter,
      include: {
        Company: true,
        status: true,
        Documents: true,
        Quotation: true,
        ProjectRequirements: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Obtener los projectRequests asociados en una consulta separada
    const projectRequestIds = items.map(item => item.projectRequestId).filter(Boolean);
    
    if (projectRequestIds.length > 0) {
      const projectRequests = await prisma.projectRequest.findMany({
        where: {
          id: {
            in: projectRequestIds as number[]
          },
          isDeleted: false,
        },
        include: {
          clientArea: {
            include: {
              client: true,
            },
          },
        },
      });
      
      // Asociar manualmente los projectRequests a los items
      const projectRequestsMap = new Map();
      projectRequests.forEach(pr => {
        projectRequestsMap.set(pr.id, pr);
      });
      
      // Procesar los items para incluir la información necesaria
      items.forEach(item => {
        if (item.projectRequestId) {
          // Añadimos manualmente la propiedad
          (item as any).ProjectRequest = projectRequestsMap.get(item.projectRequestId);
          
          // Procesar los requerimientos para tener una estructura más simple
          if ((item as any).ProjectRequirements && (item as any).ProjectRequirements.length > 0) {
            // Añadimos manualmente la propiedad
            (item as any).requirements = (item as any).ProjectRequirements.map((pr: any) => ({
              id: pr.requirementId,
              name: pr.requirement?.name || "Sin nombre",
              description: pr.requirement?.description || "",
              observations: pr.observations || ""
            }));
          } else {
            // Añadimos manualmente la propiedad
            (item as any).requirements = [];
          }
        }
      });
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error en GET /api/assigned_companies:", error);
    return NextResponse.json(
      { error: "Error al obtener las solicitudes asignadas" },
      { status: 500 }
    );
  }
}
