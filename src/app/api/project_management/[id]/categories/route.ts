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

    // Consultar directamente la tabla real con JOIN a la vista materializada para obtener progreso
    const categories = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.name,
        c.description,
        c."projectId",
        c."stageId",
        COALESCE(v.progress, 0) as progress,
        COALESCE(v.status, 'pending') as status,
        COALESCE(v.total_active_activities, 0) as total_active_activities,
        COALESCE(v.completed_activities, 0) as completed_activities,
        COALESCE(v.in_progress_activities, 0) as in_progress_activities,
        COALESCE(v.pending_activities, 0) as pending_activities,
        COALESCE(v.cancelled_activities, 0) as cancelled_activities
      FROM c_project_categories c
      LEFT JOIN project_categories_with_progress v ON c.id = v.id
      WHERE c."projectId" = ANY(${projectIds})
        AND c."isActive" = true
        AND c."isDeleted" = false
      ORDER BY c."projectId", c.name;
    `;

    // Obtener actividades para cada categoría
    const categoriesWithActivities = await Promise.all(
      (categories as any[]).map(async (category) => {
        const activities = await prisma.projectCategoryActivity.findMany({
          where: {
            projectCategoryId: category.id,
            isActive: true,
            isDeleted: false
          },
          include: {
            ProjectCategorActivityStatus: true
          },
          orderBy: {
            name: 'asc'
          }
        });

        return {
          id: category.id,
          name: category.name,
          description: category.description,
          projectId: category.projectId,
          stageId: category.stageId,
          progress: Number(category.progress),
          status: category.status,
          activities: activities.map(activity => ({
            id: activity.id,
            name: activity.name,
            status: activity.ProjectCategorActivityStatus?.name?.toLowerCase() || 'pending'
          }))
        };
      })
    );

    return NextResponse.json(categoriesWithActivities);

  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
