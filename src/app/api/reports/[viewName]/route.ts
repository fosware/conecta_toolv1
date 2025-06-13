import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
  request: NextRequest,
  context: { params: { viewName: string } }
) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener y esperar los parámetros de ruta
    const params = await context.params;
    const viewName = params.viewName;

    // Lista de vistas permitidas para consulta
    const allowedViews = [
      "v_quotation_summary",
      "v_quotations_vs_projects",
      "v_projects_costs_summary",
      "v_project_details"
    ];

    // Verificar que la vista solicitada esté en la lista de permitidas
    if (!allowedViews.includes(viewName)) {
      return NextResponse.json(
        { error: "Vista no permitida" },
        { status: 403 }
      );
    }

    // Consultar la vista directamente usando prisma.$queryRawUnsafe
    const rawResult = await prisma.$queryRawUnsafe(`SELECT * FROM ${viewName}`);
    
    // Convertir BigInt a String para que pueda ser serializado a JSON
    const result = JSON.parse(JSON.stringify(rawResult, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al consultar el reporte:", error);
    return NextResponse.json(
      { error: "Error al consultar el reporte" },
      { status: 500 }
    );
  }
}
