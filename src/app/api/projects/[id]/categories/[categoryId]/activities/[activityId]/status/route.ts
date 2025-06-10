import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { getCurrentDateInMexicoCity } from "@/lib/date-utils";

// PATCH - Actualizar solo el estado de una actividad
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string; categoryId: string; activityId: string } }
) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener y esperar los parámetros de ruta
    const params = await context.params;
    const { id, categoryId, activityId } = params;
    const projectId = parseInt(id);
    const projectCategoryId = parseInt(categoryId);
    const activityIdInt = parseInt(activityId);

    // Obtener datos del cuerpo de la solicitud
    const data = await request.json();
    
    // Validar datos requeridos
    if (data.statusId === undefined) {
      return NextResponse.json(
        { error: "El ID del estado es obligatorio" },
        { status: 400 }
      );
    }

    // Verificar que la actividad exista y pertenezca a la categoría y proyecto
    const existingActivity = await prisma.projectCategoryActivity.findFirst({
      where: {
        id: activityIdInt,
        projectCategoryId: projectCategoryId,
        ProjectCategory: {
          projectId: projectId,
        },
        isActive: true,
      },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar solo el estado de la actividad
    const updatedActivity = await prisma.projectCategoryActivity.update({
      where: {
        id: activityIdInt,
      },
      data: {
        projectCategoryActivityStatusId: data.statusId,
      },
    });
    
    // Si cambió el estado de la actividad, actualizar el estado del proyecto
    // No creamos logs aquí para evitar duplicados con los logs creados desde el frontend
    if (data.statusId !== existingActivity.projectCategoryActivityStatusId) {
      // Obtener el nombre del estado anterior y el nuevo para depuración
      const oldStatus = await prisma.projectCategoryActivityStatus.findUnique({
        where: { id: existingActivity.projectCategoryActivityStatusId }
      });
      
      const newStatus = await prisma.projectCategoryActivityStatus.findUnique({
        where: { id: data.statusId }
      });
      
      // Se eliminó el console.log de cambio de estado de actividad
      // No creamos logs aquí porque ya se crean desde el frontend
      
      // Verificar si hay actividades en progreso
      const activitiesInProgress = await prisma.projectCategoryActivity.count({
        where: {
          ProjectCategory: {
            projectId: projectId,
          },
          projectCategoryActivityStatusId: 2, // ID para "En progreso"
          isDeleted: false,
        },
      });
      
      // Si hay al menos una actividad en progreso, actualizar el proyecto a "En progreso"
      if (activitiesInProgress > 0) {
        await prisma.project.update({
          where: {
            id: projectId,
          },
          data: {
            projectStatusId: 2, // ID para "En progreso"
          },
        });
      } else {
        // Verificar si todas las actividades están completadas
        const totalActivities = await prisma.projectCategoryActivity.count({
          where: {
            ProjectCategory: {
              projectId: projectId,
            },
            isDeleted: false,
          },
        });
        
        const completedActivities = await prisma.projectCategoryActivity.count({
          where: {
            ProjectCategory: {
              projectId: projectId,
            },
            projectCategoryActivityStatusId: 3, // ID para "Completada"
            isDeleted: false,
          },
        });
        
        // Si todas las actividades están completadas, marcar el proyecto como completado
        if (totalActivities > 0 && totalActivities === completedActivities) {
          await prisma.project.update({
            where: {
              id: projectId,
            },
            data: {
              projectStatusId: 3, // ID para "Completado"
            },
          });
        } else if (completedActivities === 0) {
          // Si no hay actividades completadas ni en progreso, volver a "Por iniciar"
          await prisma.project.update({
            where: {
              id: projectId,
            },
            data: {
              projectStatusId: 1, // ID para "Por iniciar"
            },
          });
        }
      }
    }

    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error("Error al actualizar estado de actividad:", error);
    return NextResponse.json(
      { error: "Error al actualizar estado de actividad" },
      { status: 500 }
    );
  }
}
