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

    // Empresas que ya estaban seleccionadas y siguen seleccionadas
    const companiesToUpdate = currentCompanies.filter(
      (company) => selectedCompanies.includes(company.companyId)
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

      // Actualizar el estado de las empresas que ya estaban seleccionadas
      if (companiesToUpdate.length > 0) {
        for (const company of companiesToUpdate) {
          // Obtener el estado actual de la empresa
          const currentCompanyData = await tx.projectRequestCompany.findUnique({
            where: {
              id: company.id,
            },
            select: {
              statusId: true,
            },
          });

          // Solo actualizar a "Asociado seleccionado" si el estado actual es menor
          // (es decir, si no tiene un estado más avanzado)
          if (currentCompanyData && currentCompanyData.statusId < 2) {
            await tx.projectRequestCompany.update({
              where: {
                id: company.id,
              },
              data: {
                statusId: 2, // Asociado seleccionado
              },
            });
          }
        }
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

      // Obtener todos los NDAs para este cliente
      const clientNDAs = await tx.clientCompanyNDA.findMany({
        where: {
          clientId: clientId,
          isActive: true,
          isDeleted: false,
        },
      });

      // Agregar nuevas empresas seleccionadas
      for (const companyId of companiesToAdd) {
        // Buscar si existe un NDA activo para este asociado con este cliente
        const validNDA = clientNDAs.find(nda => nda.companyId === companyId);

        // Crear el registro de participante (sin referencia al NDA)
        await tx.projectRequestCompany.create({
          data: {
            companyId: companyId,
            projectRequirementsId: projectRequirementId,
            statusId: 2, // Asociado seleccionado (según la tabla de la base de datos)
            userId: userId,
            isActive: true,
          },
        });
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

    // Obtener todos los NDAs para este cliente
    const clientNDAs = await prisma.clientCompanyNDA.findMany({
      where: {
        clientId: clientId,
        isActive: true,
        isDeleted: false,
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

    // Verificar NDAs para cada participante
    const participantsWithNDA = participants.map(participant => {
      // Buscar si existe un NDA válido para este asociado con este cliente
      const validNDA = clientNDAs.find(nda => nda.companyId === participant.companyId);
      
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
    });

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
