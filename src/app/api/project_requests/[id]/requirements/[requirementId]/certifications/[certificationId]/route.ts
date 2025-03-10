import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// DELETE para eliminar una certificación requerida específica de un requerimiento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; requirementId: string; certificationId: string } }
) {
  try {
    // Extraer los IDs correctamente
    const { id, requirementId, certificationId } = await params;
    
    const parsedProjectId = parseInt(id);
    const parsedRequirementId = parseInt(requirementId);
    const parsedCertificationId = parseInt(certificationId);
    
    if (isNaN(parsedProjectId) || isNaN(parsedRequirementId) || isNaN(parsedCertificationId)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el requerimiento existe y pertenece a la solicitud de proyecto
    const existingRequirement = await prisma.projectRequirements.findFirst({
      where: {
        id: parsedRequirementId,
        projectRequestId: parsedProjectId,
        isDeleted: false,
      },
    });

    if (!existingRequirement) {
      return NextResponse.json(
        { error: "Requerimiento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que la certificación requerida existe
    const existingRequirementCertification = await prisma.requirementCertification.findFirst({
      where: {
        id: parsedCertificationId,
        projectRequirementsId: parsedRequirementId,
        isDeleted: false,
      },
    });

    if (!existingRequirementCertification) {
      return NextResponse.json(
        { error: "Certificación requerida no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar la certificación requerida (soft delete)
    await prisma.requirementCertification.update({
      where: {
        id: parsedCertificationId,
      },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Certificación requerida eliminada correctamente",
    });
  } catch (error) {
    console.error("Error in DELETE /api/project_requests/[id]/requirements/[requirementId]/certifications/[certificationId]:", error);
    return NextResponse.json(
      {
        error: "Hubo un problema al procesar tu solicitud. Por favor, intenta nuevamente.",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
