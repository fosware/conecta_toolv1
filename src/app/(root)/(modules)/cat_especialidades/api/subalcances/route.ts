import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { catSubalcancesSchema } from "@/lib/schemas/cat_subalcances";
import { getUserFromToken } from "@/lib/get-user-from-token";

const prisma = new PrismaClient();

// Obtener lista de subalcances
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const showActive = searchParams.get("showActive") === "true";
    const scopeId = searchParams.get("scopeId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    if (!scopeId) {
      return NextResponse.json({
        items: [],
        total: 0,
        totalPages: 1,
        currentPage: page,
      });
    }

    const where: Prisma.SubscopesWhereInput = {
      isDeleted: false,
      scopeId: parseInt(scopeId),
      ...(showActive && { isActive: true }),
      ...(search && {
        name: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      }),
    };

    const [subalcances, total] = await Promise.all([
      prisma.subscopes.findMany({
        where,
        skip,
        take: limit,
        orderBy: { num: "asc" },
      }),
      prisma.subscopes.count({ where }),
    ]);

    return NextResponse.json({
      items: subalcances,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error al obtener subalcances:", error);
    return NextResponse.json(
      {
        items: [],
        total: 0,
        totalPages: 1,
        currentPage: 1,
        error: "Error al obtener subalcances",
      },
      { status: 500 }
    );
  }
}

// Crear un nuevo subalcance
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

    // Verificar si ya existe un subalcance con el mismo nombre en el mismo alcance
    const existingSubalcance = await prisma.subscopes.findFirst({
      where: {
        name: {
          equals: body.name,
          mode: 'insensitive'
        },
        scopeId: body.scopeId,
        isDeleted: false,
      },
    });

    if (existingSubalcance) {
      return NextResponse.json(
        { error: "Ya existe un subalcance con este nombre en este alcance" },
        { status: 400 }
      );
    }

    // Obtener el último número de subalcance para este alcance
    const lastSubalcance = await prisma.subscopes.findFirst({
      where: {
        scopeId: body.scopeId,
        isDeleted: false,
      },
      orderBy: {
        num: 'desc',
      },
    });

    const nextNum = lastSubalcance ? lastSubalcance.num + 1 : 1;

    // Validar los datos con el schema
    let validatedData;
    try {
      validatedData = catSubalcancesSchema.parse({
        name: body.name,
        num: nextNum,
        scopeId: body.scopeId,
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

    // Crear el subalcance
    const subalcance = await prisma.subscopes.create({
      data: {
        name: validatedData.name,
        num: validatedData.num,
        scopeId: validatedData.scopeId,
        userId,
        isActive: validatedData.isActive,
        isDeleted: validatedData.isDeleted,
      },
    });

    return NextResponse.json(subalcance);
  } catch (error) {
    console.error("Error al crear subalcance:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Editar un subalcance
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

    // Verificar si ya existe un subalcance con el mismo nombre en el mismo alcance
    const existingSubalcance = await prisma.subscopes.findFirst({
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

    if (existingSubalcance) {
      return NextResponse.json(
        { error: "Ya existe un subalcance con este nombre" },
        { status: 400 }
      );
    }

    // Validar los datos con el schema
    let validatedData;
    try {
      const existingSubalcance = await prisma.subscopes.findUnique({ where: { id: body.id } });
      validatedData = catSubalcancesSchema.parse({
        name: body.name,
        num: existingSubalcance?.num || 0,
        scopeId: existingSubalcance?.scopeId || 0,
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

    // Actualizar el subalcance
    const subalcance = await prisma.subscopes.update({
      where: {
        id: body.id,
      },
      data: {
        name: validatedData.name,
        userId,
      },
    });

    return NextResponse.json(subalcance);
  } catch (error) {
    console.error("Error al actualizar subalcance:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Actualizar un subalcance
export async function PATCH(req: Request) {
  try {
    const userId = await getUserFromToken();
    const { id, isActive } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID de subalcance no proporcionado" },
        { status: 400 }
      );
    }

    const subalcance = await prisma.subscopes.update({
      where: { id: parseInt(id) },
      data: {
        isActive,
        userId,
      },
    });

    return NextResponse.json(subalcance);
  } catch (error) {
    console.error("Error al actualizar estado de subalcance:", error);
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Error al actualizar estado de subalcance" },
      { status: 500 }
    );
  }
}

// Eliminar un subalcance
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

    // Obtener el ID del URL
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "ID de subalcance no proporcionado o inválido" },
        { status: 400 }
      );
    }

    // Marcar como eliminado en lugar de eliminar físicamente
    const subalcance = await prisma.subscopes.update({
      where: {
        id: parseInt(id),
      },
      data: {
        isDeleted: true,
        userId,
      },
    });

    return NextResponse.json(subalcance);
  } catch (error) {
    console.error("Error al eliminar subalcance:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
