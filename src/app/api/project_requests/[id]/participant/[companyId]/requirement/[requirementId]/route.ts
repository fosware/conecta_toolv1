import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; companyId: string; requirementId: string }> }
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

    // Extraer los IDs correctamente
    const { id, companyId, requirementId } = await params;
    const projectRequestId = parseInt(id);
    const parsedCompanyId = parseInt(companyId);
    const parsedRequirementId = parseInt(requirementId);

    // Se eliminó el log de búsqueda de relación

    // Validar los IDs
    if (isNaN(projectRequestId) || isNaN(parsedCompanyId) || isNaN(parsedRequirementId)) {
      console.error("IDs inválidos", { projectRequestId, parsedCompanyId, parsedRequirementId });
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Buscar ESPECÍFICAMENTE la relación entre proyecto, compañía y requerimiento
    const projectRequestCompany = await prisma.projectRequestCompany.findFirst({
      where: {
        projectRequirementsId: parsedRequirementId,
        companyId: parsedCompanyId,
        isActive: true,
        isDeleted: false,
      },
      include: {
        Company: {
          select: {
            comercialName: true,
          },
        },
        ProjectRequirements: {
          select: {
            requirementName: true,
          },
        },
      },
    });

    if (!projectRequestCompany) {
      console.error("Relación no encontrada");
      return NextResponse.json(
        { error: "Relación no encontrada" },
        { status: 404 }
      );
    }

    // Se eliminó el log de relación encontrada

    return NextResponse.json({
      id: projectRequestCompany.id,
      companyId: projectRequestCompany.companyId,
      companyName: projectRequestCompany.Company?.comercialName,
      requirementId: projectRequestCompany.projectRequirementsId,
      requirementName: projectRequestCompany.ProjectRequirements?.requirementName,
    });
  } catch (error) {
    console.error("Error al obtener la relación proyecto-compañía-requerimiento:", error);
    return NextResponse.json(
      { error: "Error al obtener la relación" },
      { status: 500 }
    );
  }
}
