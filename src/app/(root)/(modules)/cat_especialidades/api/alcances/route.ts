import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
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

    const where = {
      isDeleted: false,
      ...(showActive && { isActive: true }),
      ...(specialtyId && { specialtyId: parseInt(specialtyId) }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
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
    return NextResponse.json(
      { error: "Error al obtener alcances" },
      { status: 500 }
    );
  }
}

// Crear un nuevo alcance
export async function POST(req: Request) {
  try {
    const userId = await getUserFromToken();
    const body = await req.json();
    const validatedData = catAlcancesSchema.parse({
      ...body,
      userId,
    });

    const alcance = await prisma.scopes.create({
      data: validatedData,
    });

    return NextResponse.json(alcance);
  } catch (error) {
    console.error("Error al crear alcance:", error);
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Error al crear alcance" },
      { status: 500 }
    );
  }
}

// Actualizar un alcance
export async function PUT(req: Request) {
  try {
    const userId = await getUserFromToken();
    const body = await req.json();
    const { id, ...updateData } = catAlcancesSchema.parse({
      ...body,
      userId,
    });

    if (!id) {
      return NextResponse.json(
        { error: "ID de alcance no proporcionado" },
        { status: 400 }
      );
    }

    const alcance = await prisma.scopes.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(alcance);
  } catch (error) {
    console.error("Error al actualizar alcance:", error);
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar alcance" },
      { status: 500 }
    );
  }
}

// Eliminar (lógica) un alcance
export async function DELETE(req: Request) {
  try {
    const userId = await getUserFromToken();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID de alcance no proporcionado" },
        { status: 400 }
      );
    }

    await prisma.scopes.update({
      where: { id: parseInt(id) },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar alcance:", error);
    if (error instanceof Error && error.message === "No autorizado") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Error al eliminar alcance" },
      { status: 500 }
    );
  }
}

// Cambiar estado activo/inactivo de un alcance
export async function PATCH(req: Request) {
  try {
    const userId = await getUserFromToken();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body = await req.json();
    const { isActive } = body;

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
