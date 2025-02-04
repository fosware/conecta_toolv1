import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(request: Request) {
  try {
    let userId: number;
    try {
      userId = await getUserFromToken();
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Error de autorización" },
        { status: 401 }
      );
    }

    const states = await prisma.locationState.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ items: states });
  } catch (error) {
    console.error("Error in GET /api/states:", error);
    return NextResponse.json(
      { error: "Error al obtener los estados" },
      { status: 500 }
    );
  }
}
