import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { z } from "zod";
import { handleRouteParams } from "@/lib/route-params";

// Esquema de validación para la creación de un requerimiento
const createRequirementSchema = z.object({
  requirementName: z
    .string()
    .min(1, "El nombre del requerimiento es obligatorio"),
  projectRequestId: z.number().int().positive(),
  piecesNumber: z.number().int().optional().nullable(),
  observation: z.string().optional(),
  priority: z.number().int().min(1).default(1),
});

// GET: Obtener todos los requerimientos de una solicitud de proyecto
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente
    const { id } = await params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que la solicitud de proyecto existe
    const projectRequest = await prisma.projectRequest.findFirst({
      where: {
        id: parsedId,
        isDeleted: false,
      },
    });

    if (!projectRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    // Obtener los requerimientos de la solicitud con sus participantes
    const requirements = await prisma.projectRequirements.findMany({
      where: {
        projectRequestId: parsedId,
        isDeleted: false,
      },
      include: {
        ProjectRequestCompany: {
          where: {
            isDeleted: false,
          },
          include: {
            Company: true,
            status: true,
          },
        },
        RequirementSpecialty: {
          where: {
            isDeleted: false,
          },
          include: {
            specialty: true,
            scope: true,
            subscope: true,
          },
        },
        RequirementCertification: {
          where: {
            isDeleted: false,
          },
          include: {
            certification: true,
          },
        },
      },
      orderBy: [
        {
          priority: "asc",
        },
        {
          id: "asc",
        }
      ],
    });

    return NextResponse.json({
      items: requirements,
    });
  } catch (error) {
    console.error("Error al obtener los requerimientos:", error);
    return NextResponse.json(
      { error: "Error al obtener los requerimientos" },
      { status: 500 }
    );
  }
}

// POST: Crear un nuevo requerimiento para una solicitud de proyecto
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente según las prácticas de Next.js 15
    const { id } = await params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que la solicitud de proyecto existe
    const projectRequest = await prisma.projectRequest.findFirst({
      where: {
        id: parsedId,
        isDeleted: false,
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
    const validationResult = createRequirementSchema.safeParse({
      ...body,
      projectRequestId: parsedId,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Crear el nuevo requerimiento
    const newRequirement = await prisma.projectRequirements.create({
      data: {
        requirementName: validationResult.data.requirementName,
        projectRequestId: parsedId,
        piecesNumber: validationResult.data.piecesNumber,
        observation: validationResult.data.observation,
        priority: validationResult.data.priority,
        userId: userId,
      },
    });

    return NextResponse.json(
      { message: "Requerimiento creado correctamente", item: newRequirement },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear el requerimiento:", error);
    return NextResponse.json(
      { error: "Error al crear el requerimiento" },
      { status: 500 }
    );
  }
}
