import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const showInactive = searchParams.get("showInactive") === "true";

    // Construir el filtro
    const where = {
      isDeleted: false,
      isActive: showInactive ? undefined : true,
      clientId: clientId ? parseInt(clientId) : undefined,
    };

    // Obtener las áreas de clientes
    const clientAreas = await prisma.clientAreas.findMany({
      where,
      select: {
        id: true,
        areaName: true,
        clientId: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { client: { name: "asc" } },
        { areaName: "asc" },
      ],
    });

    return NextResponse.json({
      items: clientAreas,
      total: clientAreas.length,
    });
  } catch (error) {
    console.error("Error al obtener áreas de clientes:", error);
    return NextResponse.json(
      { error: "Error al obtener las áreas de clientes" },
      { status: 500 }
    );
  }
}
