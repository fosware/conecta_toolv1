import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
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

    if (!participant || !participant.ndaSignedFile) {
      return NextResponse.json(
        { error: "Archivo NDA firmado no encontrado" },
        { status: 404 }
      );
    }

    // Crear un blob con el archivo
    const blob = new Blob([participant.ndaSignedFile]);
    
    // Crear una respuesta con el archivo
    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${participant.ndaSignedFileName || 'nda_signed.pdf'}"`,
      },
    });
  } catch (error) {
    console.error("Error al descargar NDA firmado:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
