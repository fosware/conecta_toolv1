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

    // Obtener los IDs de la URL siguiendo las mejores prácticas de Next.js 15
    const { id, specialtyId } = await params;
    const parsedProjectId = parseInt(id);
    const parsedSpecialtyId = parseInt(specialtyId);

    if (isNaN(parsedProjectId) || isNaN(parsedSpecialtyId)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Verificar que existe la solicitud de proyecto
    const projectRequest = await prisma.projectRequest.findUnique({
      where: {
        id: parsedProjectId,
        isDeleted: false,
      },
    });

    if (!projectRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que existe la especialidad
    const specialty = await prisma.specialties.findUnique({
      where: {
        id: parsedSpecialtyId,
        isDeleted: false,
      },
    });

    if (!specialty) {
      return NextResponse.json(
        { error: "Especialidad no encontrada" },
        { status: 404 }
      );
    }

    // Buscar todos los requerimientos de la solicitud
    const requirements = await prisma.projectRequirements.findMany({
      where: {
        projectRequestId: parsedProjectId,
        isDeleted: false,
      },
      select: {
        id: true
      }
    });

    const requirementIds = requirements.map(req => req.id);

    // Verificar si ya existe la especialidad en algún requerimiento
    const existingSpecialty = await prisma.requirementSpecialty.findFirst({
      where: {
        specialtyId: parsedSpecialtyId,
        projectRequirementsId: {
          in: requirementIds
        },
        isDeleted: false,
      },
    });

    if (!existingSpecialty) {
      return NextResponse.json(
        { error: "Especialidad requerida no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar la especialidad requerida (soft delete)
    await prisma.requirementSpecialty.update({
      where: {
        id: existingSpecialty.id,
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
