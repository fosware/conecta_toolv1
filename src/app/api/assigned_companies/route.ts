import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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
        ProjectRequirements: true, // Incluir la relación con el requerimiento
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Obtener los projectRequests asociados en una consulta separada
    const projectRequestIds = items
      .map((item) => item.projectRequestId)
      .filter(Boolean);

    // Obtener los requerimientos para cada ProjectRequestCompany
    const requirementsIds = items.map((item) => item.projectRequirementsId);
    
    // Obtener los requerimientos
    const requirementsData = await prisma.projectRequirements.findMany({
      where: {
        id: {
          in: requirementsIds,
        },
        isDeleted: false,
      },
      include: {
        RequirementCertification: {
          where: {
            isDeleted: false,
          },
          include: {
            certification: true,
          },
        },
        RequirementSpecialty: {
          where: {
            isDeleted: false,
          },
          include: {
            specialty: true,
          },
        },
      },
    });

    // Crear un mapa de requerimientos por ID
    const requirementsMap = new Map();
    requirementsData.forEach((req) => {
      requirementsMap.set(req.id, req);
    });

    if (projectRequestIds.length > 0) {
      const projectRequests = await prisma.projectRequest.findMany({
        where: {
          id: {
            in: projectRequestIds as number[],
          },
          isDeleted: false,
        },
        include: {
          clientArea: {
            include: {
              client: true,
            },
          },
          status: true, // Incluir el estado de la solicitud
        },
      });

      // Asociar manualmente los projectRequests a los items
      const projectRequestsMap = new Map();
      projectRequests.forEach((pr) => {
        projectRequestsMap.set(pr.id, pr);
      });

      // Procesar los items para incluir la información necesaria
      items.forEach((item) => {
        if (item.projectRequestId) {
          // Añadimos manualmente la propiedad
          (item as any).ProjectRequest = projectRequestsMap.get(
            item.projectRequestId
          );

          // Obtener el requerimiento asociado a este ProjectRequestCompany
          const requirement = requirementsMap.get(item.projectRequirementsId);

          // Añadir la información de requerimientos
          if (requirement) {
            (item as any).requirements = [
              {
                id: requirement.id,
                name: requirement.requirementName,
                projectRequestId: requirement.projectRequestId,
                certifications: requirement.RequirementCertification || [],
                specialties: requirement.RequirementSpecialty || [],
              },
            ];
          } else {
            (item as any).requirements = [];
          }
        }
      });
    }

    return NextResponse.json({
      items,
    });
  } catch (error) {
    console.error("Error en GET /api/assigned_companies:", error);
    return NextResponse.json(
      { error: "Error al obtener las empresas asignadas" },
      { status: 500 }
    );
  }
}
