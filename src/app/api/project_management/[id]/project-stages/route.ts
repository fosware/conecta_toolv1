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

    // Actualizar progreso de todas las etapas antes de consultar
    // Esto asegura que los porcentajes reflejen el estado actual de las actividades
    try {
      await prisma.$executeRaw`SELECT update_all_stages_progress();`;
    } catch (error) {
      console.error('Error updating stages progress:', error);
      // No fallar la consulta principal por esto
    }

    // Obtener todas las etapas de todos los proyectos relacionados
    try {
      const stages = await prisma.projectStage.findMany({
        where: {
          projectId: {
            in: projectIds
          },
          isDeleted: false
        },
        include: {
          project: {
            include: {
              ProjectRequestCompany: {
                include: {
                  Company: true
                }
              }
            }
          },
          ProjectCategory: {
            where: {
              isActive: true,
              isDeleted: false
            }
          }
        },
        orderBy: [
          { projectId: 'asc' },
          { order: 'asc' }
        ]
      });

    // Formatear respuesta usando progreso estático (actualizado por update_all_stages_progress)
    const formattedStages = stages.map(stage => ({
      id: stage.id,
      name: stage.name,
      description: stage.description,
      projectId: stage.projectId,
      order: stage.order,
      progress: Number(stage.progress) || 0,
      status: stage.status,
      assignedCompany: {
        id: stage.project.ProjectRequestCompany?.Company?.id || 0,
        name: stage.project.ProjectRequestCompany?.Company?.comercialName || 
              stage.project.ProjectRequestCompany?.Company?.companyName || 'Sin nombre'
      },
      categories: stage.ProjectCategory.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description
      }))
    }));

      return NextResponse.json(formattedStages);
    } catch (stageError: any) {
      console.error('Error específico obteniendo etapas:', stageError);
      throw stageError; // Re-lanzar para que lo capture el catch general
    }

  } catch (error) {
    console.error('Error obteniendo etapas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
