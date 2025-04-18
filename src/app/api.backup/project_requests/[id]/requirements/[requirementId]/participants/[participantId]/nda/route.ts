import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; requirementId: string; participantId: string } }
) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    
    // Obtener los IDs de la URL
    const { id, requirementId, participantId } = params;
    const projectRequestId = parseInt(id);
    const projectRequirementId = parseInt(requirementId);
    const participantIdNum = parseInt(participantId);
    
    if (isNaN(projectRequestId) || isNaN(projectRequirementId) || isNaN(participantIdNum)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Verificar que exista el participante
    const participant = await prisma.projectRequestCompany.findUnique({
      where: {
        id: participantIdNum,
        projectRequirementsId: projectRequirementId,
        isDeleted: false,
      },
      include: {
        Company: true
      }
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participante no encontrado" },
        { status: 404 }
      );
    }

    // Buscar el NDA asociado a la compañía para eliminarlo si existe
    const clientCompanyNDA = await prisma.clientCompanyNDA.findFirst({
      where: {
        companyId: participant.companyId,
        isActive: true,
        isDeleted: false
      }
    });

    // Si existe un NDA, lo marcamos como eliminado
    if (clientCompanyNDA) {
      await prisma.clientCompanyNDA.update({
        where: {
          id: clientCompanyNDA.id
        },
        data: {
          isDeleted: true,
          dateDeleted: new Date()
        }
      });
    }

    // Actualizar el registro para cambiar el estado a "Asociado seleccionado" (statusId: 2)
    await prisma.projectRequestCompany.update({
      where: {
        id: participantIdNum,
      },
      data: {
        statusId: 2, // "Asociado seleccionado"
        userId: userId,
      },
    });
    
    return NextResponse.json({
      message: "Archivos NDA eliminados correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar NDA:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
