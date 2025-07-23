import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { z } from "zod";

// Esquema de validación para la categoría de proyecto
const projectCategorySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  projectId: z.number().int().positive(),
});

// GET para obtener todas las categorías de un proyecto
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Asegurarse de que params sea esperado antes de acceder a sus propiedades
    const projectId = parseInt(id);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "ID de proyecto inválido" },
        { status: 400 }
      );
    }

    // Verificar que el proyecto existe
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active") !== "false"; // Por defecto muestra activos

    // Obtener las categorías del proyecto
    const categories = await prisma.projectCategory.findMany({
      where: {
        projectId,
        isDeleted: !active,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching project categories:", error);
    return NextResponse.json(
      { error: "Error al obtener las categorías del proyecto" },
      { status: 500 }
    );
  }
}

// POST para crear una nueva categoría de proyecto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Asegurarse de que params sea esperado antes de acceder a sus propiedades
    const projectId = parseInt(id);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "ID de proyecto inválido" },
        { status: 400 }
      );
    }

    // Verificar que el proyecto existe
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Validar los datos de entrada
    const body = await request.json();
    const validationResult = projectCategorySchema.safeParse({
      ...body,
      projectId, // Asegurar que el projectId sea el correcto
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          type: "VALIDATION_ERROR",
          fields: validationResult.error.errors.map((error) => ({
            field: error.path.join("."),
            message: error.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Crear la categoría (la BD maneja la restricción de unicidad automáticamente)
    const newCategory = await prisma.projectCategory.create({
      data: {
        name: data.name,
        description: data.description,
        projectId: data.projectId,
        userId, // Usuario que crea la categoría
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    console.error("Error creating project category:", error);
    
    // Manejar error de restricción de unicidad de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Ya existe una categoría activa con este nombre en este proyecto. Por favor, elige un nombre diferente." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Error al crear la categoría del proyecto" },
      { status: 500 }
    );
  }
}
