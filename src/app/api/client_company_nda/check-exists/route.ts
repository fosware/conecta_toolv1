import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { NextRequest, NextResponse } from "next/server";

// POST: Verificar si existe un NDA activo para una combinación de cliente y asociado
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener datos de la solicitud
    const data = await request.json();
    const { clientId, companyId, excludeId } = data;

    if (!clientId || !companyId) {
      return NextResponse.json(
        { 
          success: false,
          error: "Faltan datos requeridos" 
        },
        { status: 400 }
      );
    }

    // Construir la consulta base
    const whereCondition: any = {
      clientId: parseInt(clientId.toString()),
      companyId: parseInt(companyId.toString()),
      isActive: true,
      isDeleted: false
    };

    // Si se proporciona un ID para excluir (en caso de edición)
    if (excludeId) {
      whereCondition.id = { not: parseInt(excludeId.toString()) };
    }

    // Verificar si existe un NDA activo
    const existingNDA = await prisma.clientCompanyNDA.findFirst({
      where: whereCondition
    });

    return NextResponse.json({
      success: true,
      exists: !!existingNDA
    });
  } catch (error) {
    console.error("[CLIENT_COMPANY_NDA_CHECK_EXISTS]", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Error al verificar NDA" 
      },
      { status: 500 }
    );
  }
}
