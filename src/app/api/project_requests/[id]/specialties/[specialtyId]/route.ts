import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// DELETE para eliminar una especialidad requerida específica
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; specialtyId: string } }
) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Extraer los IDs correctamente
    const { id, specialtyId } = await params;

    const parsedProjectId = parseInt(id);
    const parsedSpecialtyId = parseInt(specialtyId);
    
    if (isNaN(parsedProjectId) || isNaN(parsedSpecialtyId)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Verificar que la solicitud existe
    const projectRequest = await prisma.projectRequest.findUnique({
      where: {
        id: parsedProjectId,
      },
    });

    if (!projectRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la especialidad requerida existe
    const requirementSpecialty = await prisma.requirementSpecialty.findFirst({
      where: {
        id: parsedSpecialtyId,
        projectRequestId: parsedProjectId,
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
      },
    });

    return NextResponse.json({
      success: true,
      message: "Especialidad requerida eliminada correctamente",
    });
  } catch (error) {
    console.error("Error in DELETE /api/project_requests/[id]/specialties/[specialtyId]:", error);
    return NextResponse.json(
      { error: "Error al eliminar la especialidad requerida" },
      { status: 500 }
    );
  }
}
