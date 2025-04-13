import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; companyId: string } }
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

    // Obtener los IDs de la URL siguiendo las mejores prácticas de Next.js 15
    const { id, companyId } = await params;
    const projectRequestId = parseInt(id);
    const companyIdNum = parseInt(companyId);

    if (isNaN(projectRequestId) || isNaN(companyIdNum)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Buscar el participante
    // Primero, obtenemos los requerimientos del proyecto
    const projectRequirements = await prisma.projectRequirements.findMany({
      where: {
        projectRequestId: projectRequestId,
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true
      }
    });

    // Extraemos los IDs de los requerimientos
    const requirementIds = projectRequirements.map(req => req.id);

    // Ahora buscamos el ProjectRequestCompany que coincida con alguno de estos requerimientos
    const participant = await prisma.projectRequestCompany.findFirst({
      where: {
        projectRequirementsId: {
          in: requirementIds
        },
        companyId: companyIdNum,
        isDeleted: false,
      },
      include: {
        Company: true,
        ProjectRequirements: {
          include: {
            ProjectRequest: true
          }
        }
      }
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participante no encontrado" },
        { status: 404 }
      );
    }

    // Construir la respuesta
    const response = {
      id: participant.id,
      company: participant.Company,
      statusId: participant.statusId,
      projectRequest: participant.ProjectRequirements?.ProjectRequest || null,
      requirementId: participant.projectRequirementsId
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error al obtener participante:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
