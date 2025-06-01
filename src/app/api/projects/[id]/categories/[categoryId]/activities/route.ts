import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// GET - Obtener todas las actividades de una categoría
export async function GET(
  request: NextRequest,
  context: { params: { id: string; categoryId: string } }
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
    const { id, categoryId } = params;
    const projectId = parseInt(id);
    const projectCategoryId = parseInt(categoryId);

    // Verificar que la categoría pertenezca al proyecto
    const category = await prisma.projectCategory.findFirst({
      where: {
        id: projectCategoryId,
        projectId: projectId,
        isDeleted: false,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada o no pertenece al proyecto" },
        { status: 404 }
      );
    }

    // Obtener actividades
    const activities = await prisma.projectCategoryActivity.findMany({
      where: {
        projectCategoryId: projectCategoryId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error al obtener actividades:", error);
    return NextResponse.json(
      { error: "Error al obtener actividades" },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva actividad
export async function POST(
  request: NextRequest,
  context: { params: { id: string; categoryId: string } }
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
    const { id, categoryId } = params;
    const projectId = parseInt(id);
    const projectCategoryId = parseInt(categoryId);

    // Verificar que la categoría pertenezca al proyecto
    const category = await prisma.projectCategory.findFirst({
      where: {
        id: projectCategoryId,
        projectId: projectId,
        isDeleted: false,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada o no pertenece al proyecto" },
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

    // Crear actividad
    const newActivity = await prisma.projectCategoryActivity.create({
      data: {
        name: data.name,
        description: data.description || null,
        projectCategoryId: projectCategoryId,
        projectCategoryActivityStatusId: data.projectCategoryActivityStatusId || 1, // Por defecto: Por iniciar
        dateTentativeStart: data.dateTentativeStart ? new Date(data.dateTentativeStart) : new Date(0),
        dateTentativeEnd: data.dateTentativeEnd ? new Date(data.dateTentativeEnd) : new Date(0),
        observations: data.observations || null,
        userId: userId, // Asignar el ID del usuario autenticado
        isDeleted: false,
      },
    });

    return NextResponse.json(newActivity, { status: 201 });
  } catch (error) {
    console.error("Error al crear actividad:", error);
    return NextResponse.json(
      { error: "Error al crear actividad" },
      { status: 500 }
    );
  }
}
