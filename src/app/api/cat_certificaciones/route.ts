import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { cookies } from "next/headers";
//import * as jose from "jose";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    const searchTerm = searchParams.get("search") || "";
    const onlyActive = searchParams.get("onlyActive") === "true";

    // Verificar autenticación
    const cookieStore = await cookies();
    const token = await cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No estás autenticado" },
        { status: 401 }
      );
    }

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

    return NextResponse.json(
      {
        certificaciones,
        total,
        totalPages,
        currentPage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener certificaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener certificaciones" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const userId = formData.get("userId") as string;

    // Verificar autenticación
    const cookieStore = await cookies();
    const token = await cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No estás autenticado" },
        { status: 401 }
      );
    }

    const certification = await prisma.certifications.create({
      data: {
        name,
        description,
        isActive: true,
        isDeleted: false,
        user: {
          connect: {
            id: parseInt(userId),
          },
        },
      },
    });

    return NextResponse.json(certification, { status: 201 });
  } catch (error) {
    console.error("Error al crear certificación:", error);
    return NextResponse.json(
      { error: "Error al crear certificación" },
      { status: 500 }
    );
  }
}
