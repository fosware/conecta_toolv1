import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// DELETE - Eliminar etapa específica (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id, stageId } = await params;
    const projectId = parseInt(id);
    const stageIdNum = parseInt(stageId);

    if (isNaN(projectId) || isNaN(stageIdNum)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Obtener el ID real del proyecto (puede ser ProjectRequest ID o Project ID)
    const inputId = projectId;
    
    // Intentar encontrar como Project ID primero
    let project = await prisma.project.findFirst({
      where: {
        id: inputId,
        isDeleted: false
      }
    });
    
    let actualProjectId = inputId;
    
    if (!project) {
      // Intentar como ProjectRequest ID
      const relatedProjects = await prisma.project.findMany({
        where: {
          isDeleted: false,
          ProjectRequestCompany: {
            ProjectRequirements: {
              projectRequestId: inputId
            }
          }
        }
      });
      
      if (relatedProjects.length === 0) {
        return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
      }
      
      // Usar el primer proyecto relacionado
      project = relatedProjects[0];
      actualProjectId = project.id;
    }

    // Verificar que la etapa existe y pertenece al proyecto
    const existingStage = await prisma.projectStage.findFirst({
      where: {
        id: stageIdNum,
        projectId: actualProjectId,
        isDeleted: false
      }
    });

    if (!existingStage) {
      return NextResponse.json({ error: "Etapa no encontrada" }, { status: 404 });
    }

    // Antes de eliminar la etapa, manejar las categorías asignadas
    const categoriesInStage = await prisma.projectCategory.findMany({
      where: {
        stageId: stageIdNum,
        isDeleted: false
      }
    });

    // Mover categorías de vuelta a "sin asignar" (stageId = null)
    if (categoriesInStage.length > 0) {
      await prisma.projectCategory.updateMany({
        where: {
          stageId: stageIdNum,
          isDeleted: false
        },
        data: {
          stageId: null,
          updatedAt: new Date()
        }
      });
    }

    // Realizar soft delete de la etapa
    await prisma.projectStage.update({
      where: { id: stageIdNum },
      data: { 
        isDeleted: true,
        updatedAt: new Date()
      }
    });

    // Refrescar vista materializada y actualizar progreso de etapas restantes
    try {
      await prisma.$executeRaw`SELECT refresh_project_categories_view();`;
      await prisma.$executeRaw`SELECT update_all_stages_progress();`;
    } catch (error) {
      console.error('Error refreshing views after stage deletion:', error);
      // No fallar la operación principal por esto
    }

    return NextResponse.json({ 
      message: "Etapa eliminada correctamente",
      categoriesReassigned: categoriesInStage.length
    });

  } catch (error) {
    console.error("Error deleting project stage:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
