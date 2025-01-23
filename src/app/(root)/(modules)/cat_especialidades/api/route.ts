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
    const userId = await getUserFromToken();
    const body = await req.json();
    const validatedData = catEspecialidadesSchema.parse({
      ...body,
      userId,
    });

    // Remove id from the data before creating
    const { ...createData } = validatedData;

    const especialidad = await prisma.specialties.create({
      data: createData,
    });

    return NextResponse.json(especialidad);
  } catch (error) {
    console.error("Error al crear especialidad:", error);
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Error al crear especialidad" },
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
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar especialidad:", error);
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body = await req.json();
    const { isActive } = body;

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
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Error al actualizar estado de especialidad" },
      { status: 500 }
    );
  }
}
