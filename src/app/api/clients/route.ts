import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientCreateSchema } from "@/lib/schemas/client";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const onlyActive = searchParams.get("onlyActive") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      prisma.clients.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { rfc: { contains: search, mode: "insensitive" } },
              ],
            },
            onlyActive ? { isActive: true } : {},
            { isDeleted: false },
          ],
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.clients.count({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { rfc: { contains: search, mode: "insensitive" } },
              ],
            },
            onlyActive ? { isActive: true } : {},
            { isDeleted: false },
          ],
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      clients,
      totalPages,
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error al obtener clientes",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    const body = await request.json();

    const validatedData = clientCreateSchema.parse(body);

    // Verificar si ya existe un cliente con el mismo RFC
    const existingClient = await prisma.clients.findFirst({
      where: {
        rfc: { equals: validatedData.rfc, mode: "insensitive" },
        isDeleted: false,
      },
    });

    if (existingClient) {
      return new NextResponse(
        JSON.stringify({ error: "Ya existe un cliente con este RFC" }),
        { status: 400 }
      );
    }

    const client = await prisma.clients.create({
      data: {
        ...validatedData,
        userId,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error al crear cliente:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al crear el cliente" }),
      { status: 500 }
    );
  }
}
