import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente según las mejores prácticas de Next.js
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
        price: true,
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

    // Devolver la respuesta con el código de estado 200 (OK)
    return NextResponse.json({ quotation }, { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/assigned_companies/[id]/get-quote:", error);
    return NextResponse.json(
      { error: "Error al obtener la cotización" },
      { status: 500 }
    );
  }
}
