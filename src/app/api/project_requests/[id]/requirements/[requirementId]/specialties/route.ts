import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// Esquema de validación para agregar una especialidad a un requerimiento
const addRequirementSpecialtySchema = z.object({
  specialtyId: z.number(),
  scopeId: z.number().optional(),
  subscopeId: z.number().optional(),
  observation: z.string().optional(),
});

// GET: Obtener especialidades de un requerimiento
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; requirementId: string } }
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

    // Extraer y validar parámetros correctamente
    const { id, requirementId } = await params;
    const parsedId = parseInt(id);
    const parsedRequirementId = parseInt(requirementId);

    if (isNaN(parsedId) || isNaN(parsedRequirementId)) {
      return NextResponse.json(
        { error: "ID de solicitud o requerimiento inválido" },
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

    // Obtener las especialidades asociadas al requerimiento
    const requirementSpecialties = await prisma.requirementSpecialty.findMany({
      where: {
        projectRequirementsId: parsedRequirementId,
        isDeleted: false,
      },
      include: {
        specialty: {
          select: {
            id: true,
            name: true,
          },
        },
        scope: {
          select: {
            id: true,
            name: true,
          },
        },
        subscope: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      items: requirementSpecialties,
    });
  } catch (error) {
    console.error("Error getting requirement specialties:", error);
    return NextResponse.json(
      { error: "Error al obtener las especialidades del requerimiento" },
      { status: 500 }
    );
  }
}

// POST: Agregar una especialidad a un requerimiento
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; requirementId: string } }
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

    // Extraer y validar parámetros correctamente
    const { id, requirementId } = await params;
    const parsedId = parseInt(id);
    const parsedRequirementId = parseInt(requirementId);

    if (isNaN(parsedId) || isNaN(parsedRequirementId)) {
      return NextResponse.json(
        { error: "ID de solicitud o requerimiento inválido" },
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

    // Validar datos de entrada
    const body = await request.json();
    const validationResult = addRequirementSpecialtySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Verificar que la especialidad existe
    const specialty = await prisma.specialties.findFirst({
      where: {
        id: validationResult.data.specialtyId,
        isDeleted: false,
      },
    });

    if (!specialty) {
      return NextResponse.json(
        { error: "Especialidad no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el alcance existe si se proporciona
    if (validationResult.data.scopeId) {
      const scope = await prisma.scopes.findFirst({
        where: {
          id: validationResult.data.scopeId,
          specialtyId: validationResult.data.specialtyId,
          isDeleted: false,
        },
      });

      if (!scope) {
        return NextResponse.json(
          { error: "Alcance no encontrado o no pertenece a la especialidad seleccionada" },
          { status: 404 }
        );
      }
    }

    // Verificar que el subalcance existe si se proporciona
    if (validationResult.data.subscopeId) {
      if (!validationResult.data.scopeId) {
        return NextResponse.json(
          { error: "No se puede especificar un subalcance sin un alcance" },
          { status: 400 }
        );
      }

      const subscope = await prisma.subscopes.findFirst({
        where: {
          id: validationResult.data.subscopeId,
          scopeId: validationResult.data.scopeId,
          isDeleted: false,
        },
      });

      if (!subscope) {
        return NextResponse.json(
          { error: "Subalcance no encontrado o no pertenece al alcance seleccionado" },
          { status: 404 }
        );
      }
    }

    // Verificar si ya existe una especialidad con los mismos datos
    const existingSpecialty = await prisma.requirementSpecialty.findFirst({
      where: {
        projectRequirementsId: parsedRequirementId,
        specialtyId: validationResult.data.specialtyId,
        scopeId: validationResult.data.scopeId || null,
        subscopeId: validationResult.data.subscopeId || null,
        isDeleted: false,
      },
    });

    if (existingSpecialty) {
      return NextResponse.json(
        { error: "Ya existe una especialidad con los mismos datos para este requerimiento" },
        { status: 409 }
      );
    }

    // Crear la especialidad requerida
    const newRequirementSpecialty = await prisma.requirementSpecialty.create({
      data: {
        projectRequirementsId: parsedRequirementId,
        specialtyId: validationResult.data.specialtyId,
        scopeId: validationResult.data.scopeId || null,
        subscopeId: validationResult.data.subscopeId || null,
        observation: validationResult.data.observation || null,
        userId: userId,
      },
      include: {
        specialty: {
          select: {
            id: true,
            name: true,
          },
        },
        scope: {
          select: {
            id: true,
            name: true,
          },
        },
        subscope: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Especialidad requerida agregada correctamente",
      item: newRequirementSpecialty,
    });
  } catch (error) {
    console.error("Error adding requirement specialty:", error);
    return NextResponse.json(
      { error: "Error al agregar la especialidad requerida" },
      { status: 500 }
    );
  }
}
