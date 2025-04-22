import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { z } from "zod";
import { handleRouteParams } from "@/lib/route-params";

// Esquema para validar la creación de una especialidad requerida
const requirementSpecialtySchema = z.object({
  projectRequirementsId: z.number().int().positive(),
  specialtyId: z.number().int().positive(),
  scopeId: z.number().int().positive().optional(),
  subscopeId: z.number().int().positive().optional(),
  observation: z.string().optional(),
});

// GET: Obtener todas las especialidades requeridas para una solicitud de proyecto
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Extraer el ID correctamente
    const { id } = await params;

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Verificar que la solicitud existe
    const projectRequest = await prisma.projectRequest.findUnique({
      where: {
        id: parsedId,
      },
    });

    if (!projectRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    // Primero obtenemos todos los requerimientos de la solicitud
    const projectRequirements = await prisma.projectRequirements.findMany({
      where: {
        projectRequestId: parsedId,
        isDeleted: false,
      },
      select: {
        id: true,
        requirementName: true,
      },
    });

    if (!projectRequirements.length) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Obtenemos los IDs de los requerimientos
    const requirementIds = projectRequirements.map(req => req.id);

    // Ahora obtenemos todas las especialidades asociadas a estos requerimientos
    const requirementSpecialties = await prisma.requirementSpecialty.findMany({
      where: {
        projectRequirementsId: {
          in: requirementIds,
        },
        isDeleted: false,
      },
      include: {
        specialty: true,
        scope: true,
        subscope: true,
        user: true,
        ProjectRequirements: {
          select: {
            id: true,
            requirementName: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      items: requirementSpecialties,
    });
  } catch (error) {
    console.error("Error in GET /api/project_requests/[id]/specialties:", error);
    return NextResponse.json(
      { error: "Error al obtener las especialidades requeridas" },
      { status: 500 }
    );
  }
}

// POST: Agregar una nueva especialidad requerida a una solicitud de proyecto
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Extraer el ID correctamente
    const { id } = await params;

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Verificar que la solicitud existe
    const projectRequest = await prisma.projectRequest.findUnique({
      where: {
        id: parsedId,
      },
    });

    if (!projectRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    // Validar los datos de entrada
    const body = await request.json();
    const validationResult = requirementSpecialtySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Verificar que la especialidad existe
    const specialty = await prisma.specialties.findUnique({
      where: {
        id: validatedData.specialtyId,
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
    if (validatedData.scopeId) {
      const scope = await prisma.scopes.findUnique({
        where: {
          id: validatedData.scopeId,
          specialtyId: validatedData.specialtyId,
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
    if (validatedData.subscopeId) {
      if (!validatedData.scopeId) {
        return NextResponse.json(
          { error: "No se puede especificar un subalcance sin un alcance" },
          { status: 400 }
        );
      }

      const subscope = await prisma.subscopes.findUnique({
        where: {
          id: validatedData.subscopeId,
          scopeId: validatedData.scopeId,
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

    // Verificar que el requerimiento existe y pertenece a esta solicitud
    const requirement = await prisma.projectRequirements.findFirst({
      where: {
        id: validatedData.projectRequirementsId,
        projectRequestId: parsedId,
        isDeleted: false,
      },
    });

    if (!requirement) {
      return NextResponse.json(
        { error: "Requerimiento no encontrado o no pertenece a esta solicitud" },
        { status: 404 }
      );
    }

    // Verificar si ya existe una especialidad requerida con los mismos datos
    const existingRequirement = await prisma.requirementSpecialty.findFirst({
      where: {
        projectRequirementsId: validatedData.projectRequirementsId,
        specialtyId: validatedData.specialtyId,
        scopeId: validatedData.scopeId || null,
        subscopeId: validatedData.subscopeId || null,
        isDeleted: false,
      },
    });

    if (existingRequirement) {
      return NextResponse.json(
        { error: "Ya existe una especialidad requerida con estos datos" },
        { status: 409 }
      );
    }

    // Crear la especialidad requerida
    const newRequirementSpecialty = await prisma.requirementSpecialty.create({
      data: {
        projectRequirementsId: validatedData.projectRequirementsId,
        specialtyId: validatedData.specialtyId,
        scopeId: validatedData.scopeId || null,
        subscopeId: validatedData.subscopeId || null,
        observation: validatedData.observation,
        userId,
      },
      include: {
        specialty: true,
        scope: true,
        subscope: true,
        user: true,
      },
    });

    // Actualizar el estado de la solicitud a "Gestión de Requerimientos" (ID 18)
    await prisma.projectRequest.update({
      where: { id: parsedId },
      data: { statusId: 18 }, // Estado "Gestión de Requerimientos"
    });

    return NextResponse.json({
      success: true,
      item: newRequirementSpecialty,
    });
  } catch (error) {
    console.error("Error in POST /api/project_requests/[id]/specialties:", error);
    return NextResponse.json(
      { error: "Error al agregar la especialidad requerida" },
      { status: 500 }
    );
  }
}
