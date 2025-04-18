import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

// DELETE: Eliminar una especialidad de un requerimiento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; requirementId: string; specialtyId: string } }
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

    // Validar parámetros
    const { id, requirementId, specialtyId } = await params;
    const parsedId = parseInt(id);
    const parsedRequirementId = parseInt(requirementId);
    const parsedSpecialtyId = parseInt(specialtyId);

    if (isNaN(parsedId) || isNaN(parsedRequirementId) || isNaN(parsedSpecialtyId)) {
      return NextResponse.json(
        { error: "ID de solicitud, requerimiento o especialidad inválido" },
        { status: 400 }
      );
    }

    // Verificar que el requerimiento existe y pertenece a la solicitud
    const requirement = await prisma.projectRequirements.findFirst({
      where: {
        id: parsedRequirementId,
        projectRequestId: parsedId,
        isDeleted: false,
      },
    });

    if (!requirement) {
      return NextResponse.json(
        { error: "Requerimiento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que la especialidad requerida existe
    const requirementSpecialty = await prisma.requirementSpecialty.findFirst({
      where: {
        id: parsedSpecialtyId,
        projectRequirementsId: parsedRequirementId,
        isDeleted: false,
      },
    });

    if (!requirementSpecialty) {
      return NextResponse.json(
        { error: "Especialidad requerida no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar la especialidad requerida (soft delete)
    await prisma.requirementSpecialty.update({
      where: {
        id: parsedSpecialtyId,
      },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
        userId: userId,
      },
    });

    return NextResponse.json({
      message: "Especialidad requerida eliminada correctamente",
    });
  } catch (error) {
    console.error("Error deleting requirement specialty:", error);
    return NextResponse.json(
      { error: "Error al eliminar la especialidad requerida" },
      { status: 500 }
    );
  }
}
