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
    const { id, requirementId, participantId } = await params;
    const projectRequestId = parseInt(id);
    const projectRequirementId = parseInt(requirementId);
    const participantIdNum = parseInt(participantId);
    
    if (isNaN(projectRequestId) || isNaN(projectRequirementId) || isNaN(participantIdNum)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Buscar el participante
    const participant = await prisma.projectRequestCompany.findFirst({
      where: {
        id: participantIdNum,
        projectRequirementsId: projectRequirementId,
        isDeleted: false,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participante no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar el registro para eliminar tanto el NDA original como el firmado (si existe)
    // y cambiar el estado a "Asociado seleccionado" (statusId: 2)
    await prisma.projectRequestCompany.update({
      where: {
        id: participantIdNum,
      },
      data: {
        ndaFile: null,
        ndaFileName: null,
        ndaSignedFile: null,
        ndaSignedFileName: null,
        ndaSignedAt: null,
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
