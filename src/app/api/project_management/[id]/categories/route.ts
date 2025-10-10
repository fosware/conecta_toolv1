import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectRequestId = parseInt(id);

    if (isNaN(projectRequestId)) {
      return NextResponse.json(
        { error: 'ID de ProjectRequest inválido' },
        { status: 400 }
      );
    }

    // Obtener todos los projectIds relacionados con este ProjectRequest
    const relatedProjects = await prisma.project.findMany({
      where: {
        isDeleted: false,
        ProjectRequestCompany: {
          ProjectRequirements: {
            projectRequestId: projectRequestId
          }
        }
      },
      select: {
        id: true
      }
    });

    const projectIds = relatedProjects.map(p => p.id);

    if (projectIds.length === 0) {
      return NextResponse.json([]);
    }

    // OPTIMIZACIÓN: Usar include de Prisma para traer actividades en una sola query
    // En lugar de Promise.all con N queries, hacer 1 query con JOIN
    const categories = await prisma.projectCategory.findMany({
      where: {
        projectId: { in: projectIds },
        isActive: true,
        isDeleted: false
      },
      include: {
        ProjectCategoryActivity: {
          where: {
            isActive: true,
            isDeleted: false
          },
          include: {
            ProjectCategorActivityStatus: true
          },
          orderBy: {
            name: 'asc'
          }
        }
      },
      orderBy: [
        { projectId: 'asc' },
        { name: 'asc' }
      ]
    });

    // Consultar progreso de la vista materializada para cada categoría
    const categoryIds = categories.map(c => c.id);
    const progressData = categoryIds.length > 0 
      ? await prisma.$queryRaw`
          SELECT 
            id,
            COALESCE(progress, 0) as progress,
            COALESCE(status, 'pending') as status
          FROM project_categories_with_progress
          WHERE id = ANY(${categoryIds})
        `
      : [];

    // Mapear progreso a cada categoría
    const progressMap = new Map(
      (progressData as any[]).map(p => [p.id, { progress: Number(p.progress), status: p.status }])
    );

    // Formatear respuesta
    const categoriesWithActivities = categories.map(category => {
      const progress = progressMap.get(category.id) || { progress: 0, status: 'pending' };
      
      return {
        id: category.id,
        name: category.name,
        description: category.description,
        projectId: category.projectId,
        stageId: category.stageId,
        progress: progress.progress,
        status: progress.status,
        activities: category.ProjectCategoryActivity.map(activity => ({
          id: activity.id,
          name: activity.name,
          status: activity.ProjectCategorActivityStatus?.name?.toLowerCase() || 'pending'
        }))
      };
    });

    return NextResponse.json(categoriesWithActivities);

  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
