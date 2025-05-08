import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { revalidatePath } from "next/cache";
import { AssignedCompany } from "@/lib/schemas/assigned_company";

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
    const basic = searchParams.get("basic") === "true";
    const itemId = parseInt(searchParams.get("id") || "0");

    // En un entorno real, filtraríamos por la compañía del usuario asociado
    // Por ahora, para desarrollo, mostraremos todas las asignaciones
    const companyId = parseInt(searchParams.get("companyId") || "0");

    // Construir el filtro base
    const baseFilter: Record<string, unknown> = {
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

    // Si se solicita un ID específico, filtrar por ese ID
    if (itemId > 0) {
      baseFilter.id = itemId;
    }

    // Configurar las inclusiones según si es básico o detallado
    let includeConfig = {};
    
    if (basic) {
      // Para la vista básica, solo incluir lo esencial para la tabla
      includeConfig = {
        Company: {
          select: {
            id: true,
            companyName: true,
            comercialName: true,
            contactName: true,
            email: true,
            phone: true,
          },
        },
        status: true,
        ProjectRequirements: {
          select: {
            id: true,
            requirementName: true,
            ProjectRequest: {
              select: {
                id: true,
                title: true,
                clientAreaId: true,
                clientArea: {
                  select: {
                    id: true,
                    areaName: true,
                    client: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            // Incluir información básica de especialidades para mostrar en la tabla
            RequirementSpecialty: {
              where: {
                isDeleted: false,
              },
              select: {
                id: true,
                specialty: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              take: 3, // Limitar a 3 especialidades para la vista básica
            },
          },
        },
      };
    } else {
      // Para la vista detallada, incluir toda la información
      includeConfig = {
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
        },
      };
    }

    // Obtener las solicitudes asignadas
    const items = await prisma.projectRequestCompany.findMany({
      where: baseFilter,
      include: includeConfig,
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Si es modo básico, devolver directamente los resultados sin procesamiento adicional
    if (basic) {
      // Procesar los items para incluir solo la información necesaria para la tabla
      const processedItems = items.map(item => {
        // Convertir el item a un objeto que cumpla con la interfaz AssignedCompany
        const processedItem: Partial<AssignedCompany> = {
          id: item.id,
          companyId: item.companyId,
          projectRequirementsId: item.projectRequirementsId,
          statusId: item.statusId,
          createdAt: item.createdAt,  // Incluir la fecha de creación
          updatedAt: item.updatedAt,  // Incluir la fecha de actualización
          unreadMessagesCount: 0,     // Valor por defecto
        };
        
        // Acceder a las propiedades relacionadas de forma segura
        if ('status' in item) {
          processedItem.status = item.status as AssignedCompany['status'];
        }
        
        if ('Company' in item) {
          processedItem.Company = item.Company as AssignedCompany['Company'];
        }
        
        if ('ProjectRequirements' in item) {
          const projectRequirements = item.ProjectRequirements as any;
          const projectRequest = projectRequirements?.ProjectRequest;
          const specialties = projectRequirements?.RequirementSpecialty || [];
          
          // Asignar ProjectRequest si existe
          if (projectRequest) {
            processedItem.ProjectRequest = {
              id: projectRequest.id,
              title: projectRequest.title,
              clientArea: projectRequest.clientArea,
            };
          }
          
          // Asignar ProjectRequirements
          processedItem.ProjectRequirements = {
            id: projectRequirements?.id,
            requirementName: projectRequirements?.requirementName,
            specialties: specialties.map((spec: any) => ({
              id: spec.id,
              specialty: spec.specialty
            })),
          };
          
          processedItem.requirementName = projectRequirements?.requirementName || "N/A";
        }
        
        // Obtener el conteo de mensajes no leídos si existe
        if ('unreadMessagesCount' in item) {
          processedItem.unreadMessagesCount = item.unreadMessagesCount as number;
        }
        
        return processedItem as AssignedCompany;
      });

      return NextResponse.json({
        items: processedItems,
      });
    }

    // Para el modo detallado, continuar con el procesamiento completo
    // Obtener los projectRequests asociados en una consulta separada
    const projectRequestIds = items
      .map((item) => {
        // Acceder a las propiedades de forma segura usando type assertion
        const typedItem = item as unknown as {
          ProjectRequirements?: {
            ProjectRequest?: { id?: number }
          }
        };
        return typedItem.ProjectRequirements?.ProjectRequest?.id;
      })
      .filter(Boolean) as number[];

    // Obtener los requerimientos para cada ProjectRequestCompany
    const requirementsIds = items.map((item) => item.projectRequirementsId);
    
    // Crear un mapa de requerimientos por ID
    const requirementsMap = new Map();
    items.forEach((item) => {
      // Acceder a las propiedades de forma segura usando type assertion
      const typedItem = item as unknown as { ProjectRequirements?: any };
      if (typedItem.ProjectRequirements) {
        requirementsMap.set(item.projectRequirementsId, typedItem.ProjectRequirements);
      }
    });

    // Obtener todos los projectRequests asociados con sus áreas de cliente
    let projectRequests: Array<Record<string, any>> = [];
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
      let projectRequestId: number | undefined;
      
      // Acceder a las propiedades de forma segura usando type assertion
      const typedItem = item as unknown as {
        ProjectRequirements?: {
          ProjectRequest?: { id?: number }
        }
      };
      
      projectRequestId = typedItem.ProjectRequirements?.ProjectRequest?.id;
      
      if (projectRequestId) {
        // Añadimos manualmente la propiedad ProjectRequest
        const projectRequest = projectRequestsMap.get(projectRequestId);
        if (projectRequest) {
          (item as Partial<AssignedCompany>).ProjectRequest = projectRequest;
        }

        // Obtener el requerimiento asociado a este ProjectRequestCompany
        const requirement = requirementsMap.get(item.projectRequirementsId);

        // Añadir la información de requerimientos
        if (requirement) {
          // Usar una propiedad temporal para los requerimientos
          (item as any).requirements = [
            {
              id: requirement.id,
              name: requirement.requirementName,
              projectRequestId: requirement.ProjectRequest?.id,
              certifications: requirement.RequirementCertification || [],
              specialties: requirement.RequirementSpecialty?.map((rs: any) => ({
                id: rs.id,
                name: rs.specialty?.name,
                specialtyId: rs.specialty?.id,
                scope: rs.scope,
                subScope: rs.subScope,
                observations: rs.observations,
              })) || [],
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
    return NextResponse.json(
      { error: "Error al obtener las empresas asignadas" },
      { status: 500 }
    );
  }
}
