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
        ProjectRequirements: {
          include: {
            ProjectRequest: true,
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
          }
        }, // Incluir la relación con el requerimiento y su proyecto
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Obtener los projectRequests asociados en una consulta separada
    const projectRequestIds = items
      .map((item) => item.ProjectRequirements?.ProjectRequest?.id)
      .filter(Boolean) as number[];

    // Obtener los requerimientos para cada ProjectRequestCompany
    const requirementsIds = items.map((item) => item.projectRequirementsId);
    
    // Crear un mapa de requerimientos por ID
    const requirementsMap = new Map();
    items.forEach((item) => {
      if (item.ProjectRequirements) {
        requirementsMap.set(item.projectRequirementsId, item.ProjectRequirements);
      }
    });

    // Obtener todos los projectRequests asociados con sus áreas de cliente
    let projectRequests: any[] = [];
    let clientIds: number[] = [];
    
    if (projectRequestIds.length > 0) {
      projectRequests = await prisma.projectRequest.findMany({
        where: {
          id: {
            in: projectRequestIds,
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

      // Extraer los IDs de los clientes para buscar NDAs
      clientIds = projectRequests
        .map(pr => pr.clientArea?.client?.id)
        .filter(Boolean) as number[];
    }

    // Obtener todos los NDAs para los clientes asociados
    const ndas = await prisma.clientCompanyNDA.findMany({
      where: {
        clientId: {
          in: clientIds,
        },
        isDeleted: false,
        isActive: true,
      },
    });

    // Crear mapas para acceso rápido
    const projectRequestsMap = new Map();
    projectRequests.forEach((pr) => {
      projectRequestsMap.set(pr.id, pr);
    });

    // Procesar los items para incluir la información necesaria
    items.forEach((item) => {
      // Obtener el projectRequest a través del requerimiento
      const projectRequestId = item.ProjectRequirements?.ProjectRequest?.id;
      
      if (projectRequestId) {
        // Añadimos manualmente la propiedad ProjectRequest
        const projectRequest = projectRequestsMap.get(projectRequestId);
        (item as any).ProjectRequest = projectRequest;

        // Obtener el requerimiento asociado a este ProjectRequestCompany
        const requirement = requirementsMap.get(item.projectRequirementsId);

        // Añadir la información de requerimientos
        if (requirement) {
          (item as any).requirements = [
            {
              id: requirement.id,
              name: requirement.requirementName,
              projectRequestId: requirement.ProjectRequest?.id,
              certifications: requirement.RequirementCertification || [],
              specialties: requirement.RequirementSpecialty || [],
              observation: requirement.observation || null,
              piecesNumber: requirement.piecesNumber || null,
            },
          ];
        } else {
          (item as any).requirements = [];
        }

        // Verificar si existe un NDA para esta empresa y cliente
        if (projectRequest?.clientArea?.client?.id) {
          const clientId = projectRequest.clientArea.client.id;
          const companyId = item.companyId;
          
          // Buscar el NDA correspondiente
          const nda = ndas.find(n => n.clientId === clientId && n.companyId === companyId);
          
          if (nda) {
            // Añadir información del NDA al item
            (item as any).ndaId = nda.id;
            (item as any).ndaFileName = nda.ndaSignedFileName;
            (item as any).ndaExpirationDate = nda.ndaExpirationDate;
            (item as any).hasNDA = true;
          } else {
            (item as any).hasNDA = false;
          }
        }
      }
    });

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
