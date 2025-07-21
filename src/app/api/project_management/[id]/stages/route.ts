import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { prisma } from "@/lib/prisma";

// Helper para convertir BigInt a Number de manera segura
function convertBigIntToNumber(value: any): any {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (Array.isArray(value)) {
    return value.map(convertBigIntToNumber);
  }
  if (value && typeof value === 'object') {
    const converted: any = {};
    for (const [key, val] of Object.entries(value)) {
      converted[key] = convertBigIntToNumber(val);
    }
    return converted;
  }
  return value;
}

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

    // Obtener el ID (puede ser ProjectRequest ID o Project ID)
    const inputId = parseInt(id);

    if (isNaN(inputId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Intentar encontrar como Project ID primero
    let project = await prisma.project.findFirst({
      where: {
        id: inputId,
        isDeleted: false
      }
    });

    let projectIds = [];
    
    if (project) {
      // Es un Project ID directo
      projectIds = [project.id];
    } else {
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
      
      projectIds = relatedProjects.map(p => p.id);
    }

    // Obtener etapas reales del proyecto
    const stages = await prisma.projectStage.findMany({
      where: {
        projectId: {
          in: projectIds
        },
        isDeleted: false
      },
      orderBy: {
        order: 'asc'
      },
      include: {
        user: {
          select: { id: true }
        }
      }
    });

    // Obtener categorías usando la vista materializada
    const categoriesData = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        name,
        description,
        progress,
        status,
        total_active_activities as "totalActivities",
        completed_activities as "completedActivities",
        in_progress_activities as "inProgressActivities",
        pending_activities as "pendingActivities"
      FROM project_categories_with_progress 
      WHERE "projectId" = ANY(${projectIds}) 
        AND "isDeleted" = false
      ORDER BY name
    `;

    // Transformar categorías para el frontend (convertir BigInt a Number)
    const categories = categoriesData.map(cat => {
      const convertedCat = convertBigIntToNumber(cat);
      return {
        id: convertedCat.id,
        name: convertedCat.name,
        description: convertedCat.description,
        progress: convertedCat.progress,
        status: convertedCat.status,
        assignedCompany: { 
          id: convertedCat.id, // Placeholder - se puede obtener de otra consulta si es necesario
          name: 'Empresa Asignada' // Placeholder
        },
        activities: [], // Las actividades se cargarían por separado si es necesario
        requirement: {
          id: convertedCat.id, // Placeholder
          name: 'Requerimiento', // Placeholder
          projectRequest: { 
            id: convertedCat.id, // Placeholder
            title: 'Proyecto' // Placeholder
          }
        },
        totalActivities: convertedCat.totalActivities,
        completedActivities: convertedCat.completedActivities,
        inProgressActivities: convertedCat.inProgressActivities,
        pendingActivities: convertedCat.pendingActivities,
        progressText: `${convertedCat.progress}%`, // Generar texto de progreso
        hasActivities: convertedCat.totalActivities > 0 // Calcular si tiene actividades
      };
    });

    const responseData = {
      stages: stages.map(stage => {
        const convertedStage = convertBigIntToNumber(stage);
        return {
          id: convertedStage.id,
          name: convertedStage.name,
          description: convertedStage.description,
          status: convertedStage.status,
          progress: convertedStage.progress,
          order: convertedStage.order,
          categories: [] // Las categorías se manejan por separado
        };
      }),
      categories: categories
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Error in project stages API:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack available');
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST - Crear nueva etapa
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "ID de proyecto inválido" }, { status: 400 });
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Obtener datos del cuerpo de la petición
    const { name, description } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    if (name.length > 50) {
      return NextResponse.json({ error: "El nombre no puede exceder 50 caracteres" }, { status: 400 });
    }

    if (description && description.length > 100) {
      return NextResponse.json({ error: "La descripción no puede exceder 100 caracteres" }, { status: 400 });
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

    // Obtener el siguiente orden con retry en caso de conflicto

    
    const maxOrderResult = await prisma.projectStage.aggregate({
      where: {
        projectId: actualProjectId,
        isDeleted: false
      },
      _max: {
        order: true
      }
    });

    const currentMaxOrder = maxOrderResult._max.order || 0;

    
    // Intentar crear con el siguiente orden disponible
    let nextOrder = currentMaxOrder + 1;
    let newStage;
    
    // Retry hasta 3 veces en caso de conflicto de orden
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {

        
        newStage = await prisma.projectStage.create({
          data: {
            name: name.trim(),
            description: description?.trim() || null,
            projectId: actualProjectId,
            order: nextOrder,
            progress: 0,
            status: 'pending',
            userId: userId
          },
          include: {
            user: {
              select: { id: true }
            }
          }
        });
        
        // Si llegamos aquí, la creación fue exitosa

        break;
        
      } catch (createError: any) {
        if (createError.code === 'P2002' && attempt < 3) {
          // Conflicto de orden, incrementar y reintentar

          nextOrder++;
          continue;
        } else {
          // Error diferente o último intento, lanzar error
          throw createError;
        }
      }
    }
    
    if (!newStage) {
      throw new Error('No se pudo crear la etapa después de 3 intentos');
    }

    return NextResponse.json(newStage, { status: 201 });

  } catch (error) {
    console.error("Error creating project stage:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar etapa existente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "ID de proyecto inválido" }, { status: 400 });
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Obtener datos del cuerpo de la petición
    const { stageId, name, description, progress, status, newOrder } = await request.json();

    if (!stageId) {
      return NextResponse.json({ error: "ID de etapa requerido" }, { status: 400 });
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
        id: stageId,
        projectId: actualProjectId,
        isDeleted: false
      }
    });

    if (!existingStage) {
      return NextResponse.json({ error: "Etapa no encontrada" }, { status: 404 });
    }

    // Preparar datos de actualización
    const updateData: any = {
      userId: userId
    };

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
      }
      if (name.length > 50) {
        return NextResponse.json({ error: "El nombre no puede exceder 50 caracteres" }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      if (description && description.length > 100) {
        return NextResponse.json({ error: "La descripción no puede exceder 100 caracteres" }, { status: 400 });
      }
      updateData.description = description?.trim() || null;
    }

    if (progress !== undefined) {
      if (progress < 0 || progress > 100) {
        return NextResponse.json({ error: "El progreso debe estar entre 0 y 100" }, { status: 400 });
      }
      updateData.progress = progress;
    }

    if (status !== undefined) {
      if (!['pending', 'in-progress', 'completed'].includes(status)) {
        return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
      }
      updateData.status = status;
    }

    // Si se especifica un nuevo orden, usar la función SQL para reordenar
    if (newOrder !== undefined && newOrder !== existingStage.order) {
      const reorderResult = await prisma.$queryRaw<any[]>`
        SELECT * FROM reorder_project_stages(${projectId}, ${stageId}, ${newOrder}, ${userId})
      `;
      
      if (reorderResult[0] && !reorderResult[0].success) {
        return NextResponse.json({ error: reorderResult[0].message }, { status: 400 });
      }
    }

    // Actualizar la etapa
    const updatedStage = await prisma.projectStage.update({
      where: { id: stageId },
      data: updateData,
      include: {
        user: {
          select: { id: true }
        }
      }
    });

    return NextResponse.json(updatedStage);

  } catch (error) {
    console.error("Error updating project stage:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar etapa (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "ID de proyecto inválido" }, { status: 400 });
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Obtener ID de la etapa del query string
    const { searchParams } = new URL(request.url);
    const stageIdParam = searchParams.get('stageId');
    
    if (!stageIdParam) {
      return NextResponse.json({ error: "ID de etapa requerido" }, { status: 400 });
    }

    const stageId = parseInt(stageIdParam);
    if (isNaN(stageId)) {
      return NextResponse.json({ error: "ID de etapa inválido" }, { status: 400 });
    }

    // Usar la función SQL para eliminar con reordenamiento
    const deleteResult = await prisma.$queryRaw<any[]>`
      SELECT * FROM delete_project_stage(${stageId}, ${userId})
    `;
    
    if (deleteResult[0] && !deleteResult[0].success) {
      return NextResponse.json({ error: deleteResult[0].message }, { status: 400 });
    }

    return NextResponse.json({ 
      message: "Etapa eliminada exitosamente",
      reorderedStages: deleteResult[0]?.reordered_stages || 0
    });

  } catch (error) {
    console.error("Error deleting project stage:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
