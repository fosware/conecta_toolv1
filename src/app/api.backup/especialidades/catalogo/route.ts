import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken();

    const specialties = await prisma.specialties.findMany({
      where: {
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

    return NextResponse.json({ items: specialties }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener especialidades:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al obtener las especialidades" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
