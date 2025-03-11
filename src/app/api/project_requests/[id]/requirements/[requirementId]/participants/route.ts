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

      // Agregar nuevas empresas seleccionadas
      for (const companyId of companiesToAdd) {
        await tx.projectRequestCompany.create({
          data: {
            companyId,
            projectRequirementsId: projectRequirementId,
            userId: userId,
            projectRequestId: projectRequestId, // Mantener referencia a la solicitud original
          },
        });
      }

      // Procesar archivos NDA para las empresas seleccionadas
      for (const companyId of selectedCompanies) {
        const ndaFile = formData.get(`nda_${companyId}`) as File | null;

        if (ndaFile) {
          // Buscar si ya existe un registro para esta empresa
          const existingCompany = currentCompanies.find(
            (company) => company.companyId === companyId
          );

          if (existingCompany) {
            // Actualizar el registro existente
            await tx.projectRequestCompany.update({
              where: {
                id: existingCompany.id,
              },
              data: {
                ndaFile: new Uint8Array(await ndaFile.arrayBuffer()),
                ndaFileName: ndaFile.name,
                userId: userId,
              },
            });
          } else {
            // El registro debe haber sido creado en el paso anterior
            const newCompany = await tx.projectRequestCompany.findFirst({
              where: {
                companyId,
                projectRequirementsId: projectRequirementId,
                isDeleted: false,
              },
            });

            if (newCompany) {
              await tx.projectRequestCompany.update({
                where: {
                  id: newCompany.id,
                },
                data: {
                  ndaFile: new Uint8Array(await ndaFile.arrayBuffer()),
                  ndaFileName: ndaFile.name,
                  userId: userId,
                },
              });
            }
          }
        }
      }

      // Actualizar el estado de cada asociado individualmente
      for (const companyId of selectedCompanies) {
        // Buscar el registro del asociado
        const associateRecord = await tx.projectRequestCompany.findFirst({
          where: {
            companyId: companyId,
            projectRequirementsId: projectRequirementId,
            isDeleted: false,
          },
        });

        if (associateRecord) {
          // Determinar el estado basado en los archivos NDA
          let newStatusId = 2; // Por defecto "Asociado seleccionado"

          if (associateRecord.ndaSignedFile) {
            newStatusId = 4; // "Firmado por Asociado"
          } else if (associateRecord.ndaFile) {
            newStatusId = 3; // "En espera de firma NDA"
          }

          // Actualizar el estado del asociado
          await tx.projectRequestCompany.update({
            where: {
              id: associateRecord.id,
            },
            data: {
              statusId: newStatusId,
            },
          });
        }
      }
    });

    return NextResponse.json({
      message: "Participantes actualizados correctamente",
      added: companiesToAdd.length,
      removed: companiesToRemove.length,
    });
  } catch (error) {
    console.error("Error al gestionar participantes:", error);
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

    return NextResponse.json({
      participants: participants.map((participant) => ({
        id: participant.id,
        company: participant.Company,
        statusId: participant.statusId,
        status: participant.status,
        hasNDA: !!participant.ndaFile,
        ndaFileName: participant.ndaFileName,
        hasSignedNDA: !!participant.ndaSignedFile,
        ndaSignedFileName: participant.ndaSignedFileName,
        ndaSignedAt: participant.ndaSignedAt,
      })),
    });
  } catch (error) {
    console.error("Error al obtener participantes:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
