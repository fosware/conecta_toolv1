import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    // Extraer el ID correctamente
    const { companyId } = params;
    const parsedId = parseInt(companyId);

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

    return NextResponse.json({ quotation }, { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/assigned_companies/[companyId]/get-quote:", error);
    return NextResponse.json(
      { error: "Error al obtener la cotización" },
      { status: 500 }
    );
  }
}
