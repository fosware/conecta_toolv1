import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { catEspecialidadesSchema } from "@/lib/schemas/cat_especialidades";
import { getUserFromToken } from "@/lib/get-user-from-token";

const prisma = new PrismaClient();

// Obtener lista de especialidades
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const showActive = searchParams.get("showActive") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = {
      isDeleted: false,
      ...(showActive && { isActive: true }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
    };

    const [especialidades, total] = await Promise.all([
      prisma.specialties.findMany({
        where,
        skip,
        take: limit,
        orderBy: { num: "asc" },
      }),
      prisma.specialties.count({ where }),
    ]);

    return NextResponse.json({
      items: especialidades,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error al obtener especialidades:", error);
    return NextResponse.json(
      { error: "Error al obtener especialidades" },
      { status: 500 }
    );
  }
}

// Crear una nueva especialidad
export async function POST(req: Request) {
  try {
    // Obtener el userId del token
    let userId: number;
    try {
      userId = await getUserFromToken();
    } catch (error) {
      console.error("Error al obtener el userId:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Error de autorización" },
        { status: 401 }
      );
    }

    // Obtener y validar el body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("Error al parsear el body:", error);
      return NextResponse.json(
        { error: "Error al procesar la solicitud" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una especialidad con el mismo nombre
    const existingEspecialidad = await prisma.specialties.findFirst({
      where: {
        name: {
          equals: body.name,
          mode: 'insensitive'
        },
        isDeleted: false,
      },
    });

    if (existingEspecialidad) {
      return NextResponse.json(
        { error: "Ya existe una especialidad con este nombre" },
        { status: 400 }
      );
    }

    // Obtener el último número de especialidad
    const lastEspecialidad = await prisma.specialties.findFirst({
      where: {
        isDeleted: false,
      },
      orderBy: {
        num: 'desc',
      },
    });

    const nextNum = lastEspecialidad ? lastEspecialidad.num + 1 : 1;

    // Validar los datos con el schema
    let validatedData;
    try {
      validatedData = catEspecialidadesSchema.parse({
        name: body.name,
        num: nextNum,
        isActive: true,
        isDeleted: false,
      });
    } catch (error) {
      console.error("Error de validación:", error);
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    // Crear la especialidad
    const especialidad = await prisma.specialties.create({
      data: {
        name: validatedData.name,
        num: validatedData.num,
        userId,
        isActive: validatedData.isActive,
        isDeleted: validatedData.isDeleted,
      },
    });

    return NextResponse.json(especialidad);
  } catch (error) {
    console.error("Error al crear especialidad:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Actualizar una especialidad
export async function PUT(req: Request) {
  try {
    const userId = await getUserFromToken();
    const body = await req.json();
    const { id, ...updateData } = catEspecialidadesSchema.parse({
      ...body,
      userId,
    });

    if (!id) {
      return NextResponse.json(
        { error: "ID de especialidad no proporcionado" },
        { status: 400 }
      );
    }

    const especialidad = await prisma.specialties.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(especialidad);
  } catch (error) {
    console.error("Error al actualizar especialidad:", error);
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar especialidad" },
      { status: 500 }
    );
  }
}

// Eliminar (lógica) una especialidad
export async function DELETE(req: Request) {
  try {
    const userId = await getUserFromToken();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID de especialidad no proporcionado" },
        { status: 400 }
      );
    }

    await prisma.specialties.update({
      where: { id: parseInt(id) },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
        userId,
      },
    });

    return NextResponse.json(
      { message: "Especialidad eliminada correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar especialidad:", error);
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Error al eliminar especialidad" },
      { status: 500 }
    );
  }
}

// Cambiar estado activo/inactivo de una especialidad
export async function PATCH(req: Request) {
  try {
    const userId = await getUserFromToken();
    const { id, isActive } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID de especialidad no proporcionado" },
        { status: 400 }
      );
    }

    const especialidad = await prisma.specialties.update({
      where: { id: parseInt(id) },
      data: {
        isActive,
        userId,
      },
    });

    return NextResponse.json(especialidad);
  } catch (error) {
    console.error("Error al actualizar estado de especialidad:", error);
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar estado de especialidad" },
      { status: 500 }
    );
  }
}
