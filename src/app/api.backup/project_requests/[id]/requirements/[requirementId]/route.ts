import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { z } from "zod";

// Esquema de validación para la actualización de un requerimiento
const updateRequirementSchema = z.object({
  requirementName: z
    .string()
    .min(1, "El nombre del requerimiento es obligatorio"),
  piecesNumber: z.number().int().optional().nullable(),
  observation: z.string().optional(),
});

// PUT: Actualizar un requerimiento específico
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; requirementId: string } }
) {
  try {
    // Extraer los IDs correctamente siguiendo las mejores prácticas de Next.js 15
    const { id, requirementId } = await params;
    const parsedProjectId = parseInt(id);
    const parsedRequirementId = parseInt(requirementId);

    if (isNaN(parsedProjectId) || isNaN(parsedRequirementId)) {
      return NextResponse.json(
        { error: "ID de solicitud o requerimiento inválido" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el requerimiento existe y pertenece a la solicitud
    const requirement = await prisma.projectRequirements.findFirst({
      where: {
        id: parsedRequirementId,
        projectRequestId: parsedProjectId,
        isDeleted: false,
      },
    });

    if (!requirement) {
      return NextResponse.json(
        { error: "Requerimiento no encontrado" },
        { status: 404 }
      );
    }

    // Validar los datos de entrada
    const body = await request.json();
    const validationResult = updateRequirementSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Actualizar el requerimiento
    const updatedRequirement = await prisma.projectRequirements.update({
      where: {
        id: parsedRequirementId,
      },
      data: {
        requirementName: validationResult.data.requirementName,
        piecesNumber: validationResult.data.piecesNumber,
        observation: validationResult.data.observation,
      },
    });

    return NextResponse.json({
      message: "Requerimiento actualizado correctamente",
      item: updatedRequirement,
    });
  } catch (error) {
    console.error("Error al actualizar el requerimiento:", error);
    return NextResponse.json(
      { error: "Error al actualizar el requerimiento" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un requerimiento específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; requirementId: string } }
) {
  try {
    // Extraer los IDs correctamente siguiendo las mejores prácticas de Next.js 15
    const { id, requirementId } = await params;
    const parsedProjectId = parseInt(id);
    const parsedRequirementId = parseInt(requirementId);

    if (isNaN(parsedProjectId) || isNaN(parsedRequirementId)) {
      return NextResponse.json(
        { error: "ID de solicitud o requerimiento inválido" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el requerimiento existe y pertenece a la solicitud
    const requirement = await prisma.projectRequirements.findFirst({
      where: {
        id: parsedRequirementId,
        projectRequestId: parsedProjectId,
        isDeleted: false,
      },
    });

    if (!requirement) {
      return NextResponse.json(
        { error: "Requerimiento no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el requerimiento (marcar como eliminado)
    await prisma.projectRequirements.update({
      where: {
        id: parsedRequirementId,
      },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
      },
    });

    return NextResponse.json({
      message: "Requerimiento eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar el requerimiento:", error);
    return NextResponse.json(
      { error: "Error al eliminar el requerimiento" },
      { status: 500 }
    );
  }
}
