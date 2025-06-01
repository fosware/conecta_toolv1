import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// GET - Obtener una actividad específica
export async function GET(
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

    // Obtener actividad
    const activity = await prisma.projectCategoryActivity.findFirst({
      where: {
        id: activityIdInt,
        projectCategoryId: projectCategoryId,
        ProjectCategory: {
          projectId: projectId,
        },
        isDeleted: false,
      },
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error al obtener actividad:", error);
    return NextResponse.json(
      { error: "Error al obtener actividad" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una actividad
export async function PUT(
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

    // Verificar que la actividad exista y pertenezca a la categoría y proyecto
    const existingActivity = await prisma.projectCategoryActivity.findFirst({
      where: {
        id: activityIdInt,
        projectCategoryId: projectCategoryId,
        ProjectCategory: {
          projectId: projectId,
        },
        isDeleted: false,
      },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
      );
    }

    // Obtener datos del cuerpo de la solicitud
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.name) {
      return NextResponse.json(
        { error: "El nombre de la actividad es obligatorio" },
        { status: 400 }
      );
    }

    // Actualizar actividad
    const updatedActivity = await prisma.projectCategoryActivity.update({
      where: {
        id: activityIdInt,
      },
      data: {
        name: data.name,
        description: data.description !== undefined ? data.description : existingActivity.description,
        projectCategoryActivityStatusId: data.projectCategoryActivityStatusId !== undefined 
          ? data.projectCategoryActivityStatusId 
          : existingActivity.projectCategoryActivityStatusId,
        dateTentativeStart: data.dateTentativeStart !== undefined 
          ? data.dateTentativeStart ? new Date(data.dateTentativeStart) : undefined
          : existingActivity.dateTentativeStart,
        dateTentativeEnd: data.dateTentativeEnd !== undefined 
          ? data.dateTentativeEnd ? new Date(data.dateTentativeEnd) : undefined
          : existingActivity.dateTentativeEnd,
        observations: data.observations !== undefined ? data.observations : existingActivity.observations,
      },
    });

    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error("Error al actualizar actividad:", error);
    return NextResponse.json(
      { error: "Error al actualizar actividad" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una actividad (marcándola como inactiva)
export async function DELETE(
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

    // Verificar que la actividad exista y pertenezca a la categoría y proyecto
    const existingActivity = await prisma.projectCategoryActivity.findFirst({
      where: {
        id: activityIdInt,
        projectCategoryId: projectCategoryId,
        ProjectCategory: {
          projectId: projectId,
        },
        isDeleted: false,
      },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
      );
    }

    // Implementar eliminación lógica (soft delete)
    const deletedActivity = await prisma.projectCategoryActivity.update({
      where: {
        id: activityIdInt,
      },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar actividad:", error);
    return NextResponse.json(
      { error: "Error al eliminar actividad" },
      { status: 500 }
    );
  }
}
