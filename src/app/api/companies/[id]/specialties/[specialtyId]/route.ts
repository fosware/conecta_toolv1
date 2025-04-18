import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

// PUT: Actualizar una especialidad
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; specialtyId: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id, specialtyId } = await params;
    const companyId = parseInt(id);
    const specId = parseInt(specialtyId);

    if (isNaN(companyId) || isNaN(specId)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID inválido",
        },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "El cuerpo de la solicitud es inválido",
        },
        { status: 400 }
      );
    }

    const { specialtyId: newSpecialtyId, scopeId, subscopeId, materials, machineCapacity } = body;

    if (!newSpecialtyId) {
      return NextResponse.json(
        {
          success: false,
          error: "La especialidad es requerida",
        },
        { status: 400 }
      );
    }

    // Verificar si existe la especialidad
    const existingSpecialty = await prisma.companySpecialties.findFirst({
      where: {
        id: specId,
        companyId,
      },
    });

    if (!existingSpecialty) {
      return NextResponse.json(
        {
          success: false,
          error: "Especialidad no encontrada",
        },
        { status: 404 }
      );
    }

    // Verificar si ya existe otra especialidad con la misma combinación
    const duplicateSpecialty = await prisma.companySpecialties.findFirst({
      where: {
        id: { not: specId },
        companyId,
        specialtyId: newSpecialtyId,
        scopeId: scopeId || null,
        subscopeId: subscopeId || null,
        isDeleted: false,
      },
    });

    if (duplicateSpecialty) {
      return NextResponse.json(
        {
          success: false,
          error: "Ya existe una especialidad con esta combinación",
        },
        { status: 400 }
      );
    }

    // Actualizar la especialidad
    const updatedSpecialty = await prisma.companySpecialties.update({
      where: {
        id: specId,
      },
      data: {
        specialtyId: newSpecialtyId,
        scopeId: scopeId || null,
        subscopeId: subscopeId || null,
        materials: materials || "",
        machineCapacity: machineCapacity || "",
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSpecialty,
      message: "Especialidad actualizada correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar especialidad:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al procesar la solicitud. Por favor, inténtelo de nuevo.",
      },
      {
        status: 500,
      }
    );
  }
}

// DELETE: Eliminar una especialidad
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; specialtyId: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id, specialtyId } = await params;
    const companyId = parseInt(id);
    const specId = parseInt(specialtyId);

    if (isNaN(companyId) || isNaN(specId)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID inválido",
        },
        { status: 400 }
      );
    }

    // Verificar si existe la especialidad
    const existingSpecialty = await prisma.companySpecialties.findFirst({
      where: {
        id: specId,
        companyId,
      },
    });

    if (!existingSpecialty) {
      return NextResponse.json(
        {
          success: false,
          error: "Especialidad no encontrada",
        },
        { status: 404 }
      );
    }

    // Eliminar la especialidad (soft delete)
    await prisma.companySpecialties.update({
      where: {
        id: specId,
      },
      data: {
        isActive: false,
        isDeleted: true,
        dateDeleted: new Date(),
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Especialidad eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar especialidad:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al procesar la solicitud. Por favor, inténtelo de nuevo.",
      },
      {
        status: 500,
      }
    );
  }
}
