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
    const scopeId = parseInt(id);

    if (isNaN(scopeId)) {
      return new NextResponse(
        JSON.stringify({ error: "ID de alcance inválido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const subscopes = await prisma.subscopes.findMany({
      where: {
        scopeId,
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

    return NextResponse.json({ items: subscopes }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener subalcances:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al obtener los subalcances" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
