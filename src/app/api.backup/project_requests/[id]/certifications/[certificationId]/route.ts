import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// DELETE para eliminar una certificación requerida específica
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; certificationId: string } }
) {
  try {
    // Extraer los IDs correctamente
    const { id, certificationId } = await params;
    
    const parsedProjectId = parseInt(id);
    const parsedCertificationId = parseInt(certificationId);
    
    if (isNaN(parsedProjectId) || isNaN(parsedCertificationId)) {
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

    // Verificar que la solicitud existe
    const existingRequest = await prisma.projectRequest.findFirst({
      where: {
        id: parsedProjectId,
        isDeleted: false,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la certificación requerida existe
    const existingRequirement = await prisma.requirementCertification.findFirst({
      where: {
        id: parsedCertificationId,
        projectRequestId: parsedProjectId,
        isDeleted: false,
      },
    });

    if (!existingRequirement) {
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
    console.error("Error in DELETE /api/project_requests/[id]/certifications/[certificationId]:", error);
    return NextResponse.json(
      {
        error: "Hubo un problema al procesar tu solicitud. Por favor, intenta nuevamente.",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
