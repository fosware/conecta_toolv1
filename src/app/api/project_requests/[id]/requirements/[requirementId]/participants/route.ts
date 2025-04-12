import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; requirementId: string } }
) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener los IDs de la URL
    const { id, requirementId } = await params;
    const projectRequestId = parseInt(id);
    const projectRequirementId = parseInt(requirementId);

    if (isNaN(projectRequestId) || isNaN(projectRequirementId)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    // Verificar que exista el requerimiento y pertenezca a la solicitud
    const requirement = await prisma.projectRequirements.findFirst({
      where: {
        id: projectRequirementId,
        projectRequestId: projectRequestId,
        isDeleted: false,
      },
    });

    if (!requirement) {
      return NextResponse.json(
        { error: "Requerimiento no encontrado" },
        { status: 404 }
      );
    }

    // Procesar el formulario multipart
    const formData = await request.formData();

    // Obtener las empresas seleccionadas
    const selectedCompaniesStr = formData.get("selectedCompanies");
    if (!selectedCompaniesStr || typeof selectedCompaniesStr !== "string") {
      return NextResponse.json(
        { error: "No se proporcionaron empresas seleccionadas" },
        { status: 400 }
      );
    }

    const selectedCompanies = JSON.parse(selectedCompaniesStr) as number[];

    // Obtener las empresas actuales para este requerimiento
    const currentCompanies = await prisma.projectRequestCompany.findMany({
      where: {
        projectRequirementsId: projectRequirementId,
        isDeleted: false,
      },
      select: {
        id: true,
        companyId: true,
      },
    });

    // Empresas a eliminar (están en currentCompanies pero no en selectedCompanies)
    const companiesToRemove = currentCompanies.filter(
      (company) => !selectedCompanies.includes(company.companyId)
    );

    // Empresas a agregar (están en selectedCompanies pero no en currentCompanies)
    const companiesToAdd = selectedCompanies.filter(
      (companyId) =>
        !currentCompanies.some((company) => company.companyId === companyId)
    );

    // Transacción para asegurar consistencia
    await prisma.$transaction(async (tx) => {
      // Marcar como eliminadas las empresas que ya no están seleccionadas
      if (companiesToRemove.length > 0) {
        await tx.projectRequestCompany.updateMany({
          where: {
            id: {
              in: companiesToRemove.map((company) => company.id),
            },
          },
          data: {
            isDeleted: true,
            dateDeleted: new Date(),
          },
        });
      }

      // Obtener el ID del cliente para esta solicitud de proyecto
      const projectRequest = await tx.projectRequest.findUnique({
        where: {
          id: projectRequestId,
        },
        include: {
          clientArea: {
            include: {
              client: true,
            },
          },
        },
      });

      if (!projectRequest) {
        throw new Error("Solicitud de proyecto no encontrada");
      }

      const clientId = projectRequest.clientArea.client.id;

      // Obtener la fecha actual para verificar NDAs válidos
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      console.log(
        `POST: Procesando participantes para el cliente ID: ${clientId}`
      );

      // Agregar nuevas empresas seleccionadas
      for (const companyId of companiesToAdd) {
        // Buscar si existe un NDA activo para este asociado
        // Ignoramos el clientId para permitir que un asociado use el mismo NDA con diferentes clientes
        const validNDA = await tx.clientCompanyNDA.findFirst({
          where: {
            // clientId: clientId,  // Comentamos esta línea para ignorar el clientId
            companyId: companyId,
            isActive: true,
            isDeleted: false,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (validNDA) {
          console.log(
            `  ✅ NDA válido encontrado: ID ${validNDA.id}, Expira: ${validNDA.ndaExpirationDate}`
          );
        } else {
          console.log(
            `  ❌ No se encontró NDA válido para el asociado ${companyId}`
          );
        }

        // Crear el registro de participante con o sin NDA
        await tx.projectRequestCompany.create({
          data: {
            companyId: companyId,
            projectRequirementsId: projectRequirementId,
            statusId: validNDA ? 4 : 2, // Estado inicial (por definir)
            userId: userId,
            clientCompanyNDAId: validNDA?.id || null,
          },
        });
      }

      // Actualizar el estado de cada asociado individualmente para empresas existentes
      const existingCompanies = selectedCompanies.filter(
        (companyId) => !companiesToAdd.includes(companyId)
      );

      for (const companyId of existingCompanies) {
        // Buscar si existe un NDA activo para este asociado
        // Ignoramos el clientId para permitir que un asociado use el mismo NDA con diferentes clientes
        const validNDA = await tx.clientCompanyNDA.findFirst({
          where: {
            // clientId: clientId,  // Comentamos esta línea para ignorar el clientId
            companyId: companyId,
            isActive: true,
            isDeleted: false,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Buscar el registro del asociado
        const associateRecord = await tx.projectRequestCompany.findFirst({
          where: {
            companyId: companyId,
            projectRequirementsId: projectRequirementId,
            isDeleted: false,
          },
        });

        if (associateRecord) {
          // Determinar el estado basado en si existe un NDA
          const newStatusId = validNDA ? 4 : 2; // Estado inicial (por definir)

          // Actualizar el estado del asociado
          await tx.projectRequestCompany.update({
            where: {
              id: associateRecord.id,
            },
            data: {
              statusId: newStatusId,
              clientCompanyNDAId: validNDA?.id || null,
            },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Participantes actualizados correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar participantes:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

// Endpoint para obtener los participantes de un requerimiento
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; requirementId: string } }
) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener los IDs de la URL siguiendo las mejores prácticas de Next.js 15
    const { id, requirementId } = await params;
    const projectRequestId = parseInt(id);
    const projectRequirementId = parseInt(requirementId);

    if (isNaN(projectRequestId) || isNaN(projectRequirementId)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    // Obtener el proyecto para saber el cliente
    const projectRequest = await prisma.projectRequest.findUnique({
      where: {
        id: projectRequestId,
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

    if (!projectRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    const clientId = projectRequest.clientArea.client.id;

    // Obtener la fecha actual para verificar NDAs válidos
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Obtener todos los NDAs disponibles para referencia
    const allNDAs = await prisma.clientCompanyNDA.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        clientId: true,
        companyId: true,
        isActive: true,
        ndaExpirationDate: true,
      },
    });

    // Obtener los participantes del requerimiento
    const participants = await prisma.projectRequestCompany.findMany({
      where: {
        projectRequirementsId: projectRequirementId,
        isDeleted: false,
      },
      include: {
        Company: {
          select: {
            id: true,
            comercialName: true,
            contactName: true,
            email: true,
            phone: true,
          },
        },
        status: true,
      },
    });

    // Buscar NDAs válidos para cada participante
    const participantsWithNDA = await Promise.all(
      participants.map(async (participant) => {
        // Buscar directamente en la base de datos si existe un NDA válido para este asociado
        // Ignoramos el clientId para permitir que un asociado use el mismo NDA con diferentes clientes
        const validNDA = await prisma.clientCompanyNDA.findFirst({
          where: {
            // clientId: clientId,  // Comentamos esta línea para ignorar el clientId
            companyId: participant.companyId,
            isActive: true,
            isDeleted: false,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Determinar si tiene un NDA válido
        const hasValidNDA = !!validNDA;

        return {
          id: participant.id,
          company: participant.Company,
          status: participant.status,
          hasNDA: hasValidNDA,
          ndaId: validNDA?.id || null,
          ndaExpirationDate: validNDA?.ndaExpirationDate || null,
          ndaFileName: validNDA?.ndaSignedFileName || null,
        };
      })
    );

    return NextResponse.json({
      participants: participantsWithNDA,
    });
  } catch (error) {
    console.error("Error al obtener participantes:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
