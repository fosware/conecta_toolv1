import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

// GET: Obtener alcances de una especialidad
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const paramsValue = await params;
    const routeParams = handleRouteParams(params);
    const { id  } = routeParams;
    const specialtyId = parseInt(id);

    if (isNaN(specialtyId)) {
      return NextResponse.json(
        { 
          success: false,
          error: "ID de especialidad inválido" 
        },
        { status: 400 }
      );
    }

    const scopes = await prisma.scopes.findMany({
      where: {
        specialtyId,
        isActive: true,
        isDeleted: false,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: scopes
    });
  } catch (error) {
    console.error("Error al obtener alcances:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener alcances" 
    }, { 
      status: 500 
    });
  }
}
