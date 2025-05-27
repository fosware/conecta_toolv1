import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleRouteParams } from "@/lib/route-params";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer y validar el ID del proyecto
    const { id } = await handleRouteParams(params);
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "ID de proyecto inválido" },
        { status: 400 }
      );
    }

    // Verificar que el proyecto existe
    const projectRequest = await prisma.projectRequest.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!projectRequest) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Obtener todas las compañías participantes con sus cotizaciones
    const participants = await prisma.projectRequestCompany.findMany({
      where: {
        ProjectRequirements: {
          projectRequestId: projectId,
        },
      },
      select: {
        id: true,
        Quotation: {
          select: {
            id: true,
            quotationFile: true,
          },
        },
      },
    });

    // Crear un mapa de compañías con cotizaciones
    const quotationsMap: Record<number, boolean> = {};
    
    participants.forEach((participant) => {
      quotationsMap[participant.id] = participant.Quotation !== null && 
                                       participant.Quotation?.quotationFile !== null;
    });

    return NextResponse.json(quotationsMap);
  } catch (error) {
    console.error("Error al obtener cotizaciones:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
