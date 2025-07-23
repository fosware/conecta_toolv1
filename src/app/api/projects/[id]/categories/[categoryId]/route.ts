import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { z } from "zod";

// Esquema de validación para actualizar una categoría
const updateProjectCategorySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  projectId: z.number().int().positive(),
});

// GET para obtener una categoría específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Asegurarse de que params sea esperado antes de acceder a sus propiedades
    const { id, categoryId: catId } = await params;
    const projectId = parseInt(id);
    const categoryId = parseInt(catId);
    
    if (isNaN(projectId) || isNaN(categoryId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Obtener la categoría
    const category = await prisma.projectCategory.findFirst({
      where: {
        id: categoryId,
        projectId,
        isDeleted: false,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching project category:", error);
    return NextResponse.json(
      { error: "Error al obtener la categoría del proyecto" },
      { status: 500 }
    );
  }
}

// PUT para actualizar una categoría
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Asegurarse de que params sea esperado antes de acceder a sus propiedades
    const { id, categoryId: catId } = await params;
    const projectId = parseInt(id);
    const categoryId = parseInt(catId);
    
    if (isNaN(projectId) || isNaN(categoryId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Verificar que la categoría existe
    const existingCategory = await prisma.projectCategory.findFirst({
      where: {
        id: categoryId,
        projectId,
        isDeleted: false,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    // Validar los datos de entrada
    const body = await request.json();
    const validationResult = updateProjectCategorySchema.safeParse({
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

    // Actualizar la categoría (la BD maneja la restricción de unicidad automáticamente)
    const updatedCategory = await prisma.projectCategory.update({
      where: {
        id: categoryId,
      },
      data: {
        name: data.name,
        description: data.description,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error: any) {
    console.error("Error updating project category:", error);
    
    // Manejar error de restricción de unicidad de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Ya existe una categoría activa con este nombre en este proyecto. Por favor, elige un nombre diferente." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Error al actualizar la categoría del proyecto" },
      { status: 500 }
    );
  }
}

// DELETE para eliminar una categoría (marcándola como eliminada)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Asegurarse de que params sea esperado antes de acceder a sus propiedades
    const { id, categoryId: catId } = await params;
    const projectId = parseInt(id);
    const categoryId = parseInt(catId);
    
    if (isNaN(projectId) || isNaN(categoryId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Verificar que la categoría existe
    const existingCategory = await prisma.projectCategory.findFirst({
      where: {
        id: categoryId,
        projectId,
        isDeleted: false,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    // Marcar la categoría como eliminada e inactiva
    const deletedCategory = await prisma.projectCategory.update({
      where: {
        id: categoryId,
      },
      data: {
        isDeleted: true,
        isActive: false, // Importante: marcar como inactiva para liberar la restricción de unicidad
        dateDeleted: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project category:", error);
    return NextResponse.json(
      { error: "Error al eliminar la categoría del proyecto" },
      { status: 500 }
    );
  }
}
