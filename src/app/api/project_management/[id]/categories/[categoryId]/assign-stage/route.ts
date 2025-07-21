import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// PUT - Asignar categoría a una etapa (drag & drop)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const { id, categoryId } = await params;
    const projectId = parseInt(id);
    const categoryIdNum = parseInt(categoryId);

    if (isNaN(projectId) || isNaN(categoryIdNum)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Obtener datos del cuerpo de la petición
    const { stageId } = await request.json();

    // Verificar que la categoría existe
    const category = await prisma.projectCategory.findFirst({
      where: {
        id: categoryIdNum,
        isDeleted: false
      }
    });

    if (!category) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    // Si se asigna a una etapa, verificar que la etapa existe
    if (stageId !== null && stageId !== undefined) {
      // Mostrar todas las etapas disponibles para debug
      const allStages = await prisma.projectStage.findMany({
        where: { isDeleted: false },
        select: { id: true, name: true, projectId: true }
      });
      
      const stage = await prisma.projectStage.findFirst({
        where: {
          id: stageId,
          isDeleted: false
        }
      });

      if (!stage) {
        return NextResponse.json({ 
          error: `Etapa no encontrada. ID: ${stageId}`,
          availableStages: allStages
        }, { status: 404 });
      }
    }

    // Actualizar la asignación de la categoría
    const updatedCategory = await prisma.projectCategory.update({
      where: { id: categoryIdNum },
      data: {
        stageId: stageId || null, // null si se quita de la etapa
        updatedAt: new Date()
      }
    });
    


    // El progreso de las etapas se actualiza automáticamente con la función SQL optimizada
    // que se ejecuta más abajo junto con el refresh de la vista materializada

    // Refrescar la vista materializada para asegurar datos actualizados
    try {
      await prisma.$executeRaw`SELECT refresh_project_categories_view();`;
      // Actualizar progreso de todas las etapas
      await prisma.$executeRaw`SELECT update_all_stages_progress();`;
    } catch (error) {
      console.error('Error refreshing materialized view or updating stages:', error);
      // No fallar la operación principal por esto
    }

    return NextResponse.json({
      message: "Categoría asignada exitosamente",
      category: updatedCategory
    });

  } catch (error) {
    console.error("Error assigning category to stage:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}


