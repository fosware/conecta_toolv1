import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { z } from "zod";

// Esquema de validación para la creación de un requerimiento
const createRequirementSchema = z.object({
  requirementName: z.string().min(1, "El nombre del requerimiento es obligatorio"),
  projectRequestId: z.number().int().positive(),
});

// GET: Obtener todos los requerimientos de una solicitud de proyecto
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente
    const id = params.id;
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

    // Obtener los requerimientos de la solicitud
    const requirements = await prisma.projectRequirements.findMany({
      where: {
        projectRequestId: parsedId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
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
    // Extraer el ID correctamente
    const id = params.id;
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
