import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente según las mejores prácticas de Next.js 15
    const { id } = await params;
    const parsedId = parseInt(id);

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener la cotización existente
    const quotation = await prisma.projectRequestRequirementQuotation.findUnique({
      where: {
        projectRequestCompanyId: parsedId,
      },
      select: {
        id: true,
        materialCost: true,
        directCost: true,
        indirectCost: true,
        projectTypesId: true,
        additionalDetails: true,
        quotationFileName: true,
        QuotationSegment: {
          where: {
            isActive: true,
            isDeleted: false,
          },
          select: {
            id: true,
            estimatedDeliveryDate: true,
            description: true,
          },
          orderBy: {
            estimatedDeliveryDate: 'asc',
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { message: "No se encontró cotización para este proyecto" },
        { status: 404 }
      );
    }

    return NextResponse.json({ quotation });
  } catch (error) {
    console.error("Error al obtener la cotización:", error);
    return NextResponse.json(
      { error: "Error al obtener la cotización" },
      { status: 500 }
    );
  }
}
