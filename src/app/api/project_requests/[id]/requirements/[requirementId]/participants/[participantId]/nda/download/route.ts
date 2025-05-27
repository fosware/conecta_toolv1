import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

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
    const routeParams = await handleRouteParams(params);
const { id, requirementId, participantId  } = routeParams;
    const projectRequestId = parseInt(id);
    const projectRequirementId = parseInt(requirementId);
    const parsedParticipantId = parseInt(participantId);

    if (isNaN(projectRequestId) || isNaN(projectRequirementId) || isNaN(parsedParticipantId)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Buscar el participante
    const projectRequestCompany = await prisma.projectRequestCompany.findUnique({
      where: {
        id: parsedParticipantId,
        projectRequirementsId: projectRequirementId,
        isDeleted: false,
      },
      include: {
        Company: true
      }
    });

    if (!projectRequestCompany) {
      return NextResponse.json(
        { error: "Participante no encontrado" },
        { status: 404 }
      );
    }

    // Buscar el NDA asociado a la compañía
    const clientCompanyNDA = await prisma.clientCompanyNDA.findFirst({
      where: {
        companyId: projectRequestCompany.companyId,
        isActive: true,
        isDeleted: false
      }
    });

    // Verificar que exista el NDA
    if (!clientCompanyNDA || !clientCompanyNDA.ndaSignedFile) {
      return NextResponse.json(
        { error: "NDA no encontrado" },
        { status: 404 }
      );
    }

    // Obtener el archivo del NDA
    const ndaFile = clientCompanyNDA.ndaSignedFile;
    const ndaFileName = clientCompanyNDA.ndaSignedFileName;

    // Configurar la respuesta con el archivo
    const headers = new Headers();
    headers.set(
      "Content-Disposition",
      `attachment; filename="${ndaFileName || 'nda.pdf'}"`
    );
    headers.set("Content-Type", "application/pdf");

    return new NextResponse(ndaFile, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error al descargar NDA:", error);
    return NextResponse.json(
      { error: "Error al descargar NDA" },
      { status: 500 }
    );
  }
}
