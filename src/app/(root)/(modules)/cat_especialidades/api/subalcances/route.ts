import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
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

    const where = {
      isDeleted: false,
      ...(showActive && { isActive: true }),
      ...(scopeId && { scopeId: parseInt(scopeId) }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
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
      { error: "Error al obtener subalcances" },
      { status: 500 }
    );
  }
}

// Crear un nuevo subalcance
export async function POST(req: Request) {
  try {
    const userId = await getUserFromToken();
    const body = await req.json();
    const validatedData = catSubalcancesSchema.parse({
      ...body,
      userId,
    });

    const subalcance = await prisma.subscopes.create({
      data: validatedData,
    });

    return NextResponse.json(subalcance);
  } catch (error) {
    console.error("Error al crear subalcance:", error);
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Error al crear subalcance" },
      { status: 500 }
    );
  }
}

// Actualizar un subalcance
export async function PUT(req: Request) {
  try {
    const userId = await getUserFromToken();
    const body = await req.json();
    const { id, ...updateData } = catSubalcancesSchema.parse({
      ...body,
      userId,
    });

    if (!id) {
      return NextResponse.json(
        { error: "ID de subalcance no proporcionado" },
        { status: 400 }
      );
    }

    const subalcance = await prisma.subscopes.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(subalcance);
  } catch (error) {
    console.error("Error al actualizar subalcance:", error);
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar subalcance" },
      { status: 500 }
    );
  }
}

// Eliminar (lógica) un subalcance
export async function DELETE(req: Request) {
  try {
    const userId = await getUserFromToken();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID de subalcance no proporcionado" },
        { status: 400 }
      );
    }

    await prisma.subscopes.update({
      where: { id: parseInt(id) },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar subalcance:", error);
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Error al eliminar subalcance" },
      { status: 500 }
    );
  }
}

// Cambiar estado activo/inactivo de un subalcance
export async function PATCH(req: Request) {
  try {
    const userId = await getUserFromToken();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body = await req.json();
    const { isActive } = body;

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
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar estado de subalcance" },
      { status: 500 }
    );
  }
}
