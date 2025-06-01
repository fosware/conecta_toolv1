import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

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

    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error("Error al actualizar estado de actividad:", error);
    return NextResponse.json(
      { error: "Error al actualizar estado de actividad" },
      { status: 500 }
    );
  }
}
