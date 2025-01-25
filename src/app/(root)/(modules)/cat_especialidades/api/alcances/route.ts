import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { catAlcancesSchema } from "@/lib/schemas/cat_alcances";
import { getUserFromToken } from "@/lib/get-user-from-token";

const prisma = new PrismaClient();

// Obtener lista de alcances
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const showActive = searchParams.get("showActive") === "true";
    const specialtyId = searchParams.get("specialtyId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    if (!specialtyId) {
      return NextResponse.json({
        items: [],
        total: 0,
        totalPages: 1,
        currentPage: page,
      });
    }

    const where: Prisma.ScopesWhereInput = {
      isDeleted: false,
      specialtyId: parseInt(specialtyId),
      ...(showActive && { isActive: true }),
      ...(search && {
        name: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      }),
    };

    const [alcances, total] = await Promise.all([
      prisma.scopes.findMany({
        where,
        skip,
        take: limit,
        orderBy: { num: "asc" },
      }),
      prisma.scopes.count({ where }),
    ]);

    return NextResponse.json({
      items: alcances,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error al obtener alcances:", error);
    return NextResponse.json({
      items: [],
      total: 0,
      totalPages: 1,
      currentPage: 1,
      error: "Error al obtener alcances"
    }, { status: 500 });
  }
}

// Crear un nuevo alcance
export async function POST(req: Request) {
  try {
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

    // Verificar si ya existe un alcance con el mismo nombre en la misma especialidad
    const existingAlcance = await prisma.scopes.findFirst({
      where: {
        name: {
          equals: body.name,
          mode: 'insensitive'
        },
        specialtyId: body.specialtyId,
        isDeleted: false,
      },
    });

    if (existingAlcance) {
      return NextResponse.json(
        { error: "Ya existe un alcance con este nombre en esta especialidad" },
        { status: 400 }
      );
    }

    // Obtener el último número de alcance para esta especialidad
    const lastAlcance = await prisma.scopes.findFirst({
      where: {
        specialtyId: body.specialtyId,
        isDeleted: false,
      },
      orderBy: {
        num: 'desc',
      },
    });

    const nextNum = lastAlcance ? lastAlcance.num + 1 : 1;

    // Validar los datos con el schema
    let validatedData;
    try {
      validatedData = catAlcancesSchema.parse({
        name: body.name,
        num: nextNum,
        specialtyId: body.specialtyId,
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

    // Crear el alcance
    const alcance = await prisma.scopes.create({
      data: {
        name: validatedData.name,
        num: validatedData.num,
        specialtyId: validatedData.specialtyId,
        userId,
        isActive: validatedData.isActive,
        isDeleted: validatedData.isDeleted,
      },
    });

    return NextResponse.json(alcance);
  } catch (error) {
    console.error("Error al crear alcance:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Editar un alcance
export async function PUT(req: Request) {
  try {
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

    // Verificar si ya existe un alcance con el mismo nombre en la misma especialidad
    const existingAlcance = await prisma.scopes.findFirst({
      where: {
        name: {
          equals: body.name,
          mode: 'insensitive'
        },
        id: {
          not: body.id
        },
        isDeleted: false,
      },
    });

    if (existingAlcance) {
      return NextResponse.json(
        { error: "Ya existe un alcance con este nombre" },
        { status: 400 }
      );
    }

    // Validar los datos con el schema
    let validatedData;
    try {
      const existingAlcance = await prisma.scopes.findUnique({ where: { id: body.id } });
      validatedData = catAlcancesSchema.parse({
        name: body.name,
        num: existingAlcance?.num || 0,
        specialtyId: existingAlcance?.specialtyId || 0,
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

    // Actualizar el alcance
    const alcance = await prisma.scopes.update({
      where: {
        id: body.id,
      },
      data: {
        name: validatedData.name,
        userId,
      },
    });

    return NextResponse.json(alcance);
  } catch (error) {
    console.error("Error al actualizar alcance:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Actualizar un alcance
export async function PATCH(req: Request) {
  try {
    const userId = await getUserFromToken();
    const { id, isActive } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID de alcance no proporcionado" },
        { status: 400 }
      );
    }

    const alcance = await prisma.scopes.update({
      where: { id: parseInt(id) },
      data: {
        isActive,
        userId,
      },
    });

    return NextResponse.json(alcance);
  } catch (error) {
    console.error("Error al actualizar estado de alcance:", error);
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar estado de alcance" },
      { status: 500 }
    );
  }
}

// Eliminar un alcance
export async function DELETE(req: Request) {
  try {
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

    if (!body.id) {
      return NextResponse.json(
        { error: "ID de alcance no proporcionado" },
        { status: 400 }
      );
    }

    // Verificar si el alcance existe
    const alcance = await prisma.scopes.findUnique({
      where: { id: body.id },
    });

    if (!alcance) {
      return NextResponse.json(
        { error: "Alcance no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete del alcance
    const deletedAlcance = await prisma.scopes.update({
      where: { id: body.id },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
        userId,
      },
    });

    return NextResponse.json(deletedAlcance);
  } catch (error) {
    console.error("Error al eliminar alcance:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
