import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

// GET: Obtener subalcances de un alcance
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const paramsValue = await params;
    const routeParams = await handleRouteParams(params);
    const { id  } = routeParams;
    const scopeId = parseInt(id);

    if (isNaN(scopeId)) {
      return NextResponse.json(
        { 
          success: false,
          error: "ID de alcance inválido" 
        },
        { status: 400 }
      );
    }

    const subscopes = await prisma.subscopes.findMany({
      where: {
        scopeId,
        isActive: true,
        isDeleted: false,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: subscopes
    });
  } catch (error) {
    console.error("Error al obtener subalcances:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener subalcances" 
    }, { 
      status: 500 
    });
  }
}
