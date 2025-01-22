import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    const searchTerm = searchParams.get("search") || "";
    const onlyActive = searchParams.get("onlyActive") === "true";

    const where: Prisma.CertificationsWhereInput = {
      isDeleted: false,
      isActive: onlyActive || undefined,
      OR: searchTerm
        ? [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
          ]
        : undefined,
    };

    const total = await prisma.certifications.count({ where });
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const skip = (page - 1) * limit;

    const certifications = await prisma.certifications.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { name: "asc" },
    });

    const certificaciones = certifications.map((certificacion) => ({
      id: certificacion.id,
      name: certificacion.name,
      isActive: certificacion.isActive,
      description: certificacion.description,
      userId: certificacion.user.id,
    }));

    return NextResponse.json({
      certificaciones,
      total,
      totalPages,
      currentPage,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener certificaciones" },
      { status: 500 }
    );
  }
}

// Crear una nueva certificación
export async function POST(req: Request) {
  try {
    const jsonData = await req.json();
    const { name, description, userId } = jsonData;

    if (!name || !userId) {
      return NextResponse.json(
        { message: "El nombre y el ID del usuario son requeridos." },
        { status: 400 }
      );
    }

    const existingCertification = await prisma.certifications.findFirst({
      where: { name },
    });

    if (existingCertification) {
      return NextResponse.json(
        { message: "Ya existe una certificación con ese nombre." },
        { status: 400 }
      );
    }

    const certification = await prisma.certifications.create({
      data: {
        name,
        description,
        userId: parseInt(userId, 10),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(certification, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Error al crear la certificación." },
      { status: 500 }
    );
  }
}

// Eliminar una certificación
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: "ID de certificación es requerido." },
        { status: 400 }
      );
    }

    const deletedCertification = await prisma.certifications.update({
      where: { id },
      data: { isDeleted: true, dateDeleted: new Date() },
    });

    return NextResponse.json(deletedCertification);
  } catch {
    return NextResponse.json(
      { message: "Error al eliminar certificación." },
      { status: 500 }
    );
  }
}
