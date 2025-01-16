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
  } catch (error) {
    console.error("Error al obtener certificaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener certificaciones" },
      { status: 500 }
    );
  }
}

// Crear una nueva certificación
export async function POST(req: Request) {
  try {
    const data = await req.json();
    // Lógica para crear una nueva certificación
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const userId = formData.get("userId") as string;

    // Validar datos requeridos
    if (!name || !description || !userId) {
      return NextResponse.json(
        { message: "Faltan datos requeridos." },
        { status: 400 }
      );
    }

    // Verificar si la certificación ya existe
    const existingCertification = await prisma.certifications.findUnique({
      where: { name },
    });
    if (existingCertification) {
      return NextResponse.json(
        { message: "La certificación ya existe." },
        { status: 400 }
      );
    }

    await prisma.certifications.create({
      data: {
        name,
        description,
        userId: parseInt(userId, 10),
      },
    });

    return NextResponse.json({
      message: "Certificación creada con éxito",
      data,
    });
  } catch (error) {
    console.error("Error al crear certificación:", error);
    return NextResponse.json(
      { message: "Error al crear certificación." },
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
  } catch (error) {
    console.error("Error al eliminar certificación:", error);
    return NextResponse.json(
      { message: "Error al eliminar certificación." },
      { status: 500 }
    );
  }
}
