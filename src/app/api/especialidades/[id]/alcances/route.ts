import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id } = await params;
    const specialtyId = parseInt(id);

    if (isNaN(specialtyId)) {
      return new NextResponse(
        JSON.stringify({ error: "ID de especialidad inválido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const scopes = await prisma.scopes.findMany({
      where: {
        specialtyId,
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ items: scopes }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener alcances:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al obtener los alcances" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
