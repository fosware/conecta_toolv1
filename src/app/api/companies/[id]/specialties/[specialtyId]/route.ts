import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; specialtyId: string } }
) {
  try {
    const userId = await getUserFromToken();
    const paramsValue = await params;
    const { id, specialtyId } = paramsValue;
    const companyId = parseInt(id);
    const specId = parseInt(specialtyId);

    if (isNaN(companyId) || isNaN(specId)) {
      return NextResponse.json(
        { 
          success: false,
          error: "ID de empresa o especialidad inválido" 
        },
        { status: 400 }
      );
    }

    // Verificar que la especialidad existe y pertenece a la empresa
    const specialty = await prisma.companySpecialties.findFirst({
      where: {
        id: specId,
        companyId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!specialty) {
      return NextResponse.json(
        { 
          success: false,
          error: "Especialidad no encontrada" 
        },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.companySpecialties.update({
      where: {
        id: specId,
      },
      data: {
        isActive: false,
        isDeleted: true,
        userId,
      },
    });

    return NextResponse.json({ 
      success: true,
      message: "Especialidad eliminada correctamente" 
    });
  } catch (error) {
    console.error("Error al eliminar especialidad:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Error al eliminar la especialidad" 
      },
      { status: 500 }
    );
  }
}
