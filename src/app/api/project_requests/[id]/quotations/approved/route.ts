import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "@/lib/auth";

// Definir la interfaz para las cotizaciones formateadas
interface FormattedQuotation {
  id: number;
  companyId: number;
  companyName: string;
  materialCost: number;
  directCost: number;
  indirectCost: number;
  totalCost: number;
  isSelected: boolean;
}

// Obtener cotizaciones aprobadas (con status "Revisión Ok") para una solicitud de proyecto
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar el token de autenticación
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener y validar el ID del proyecto
    const { id } = await params;
    const projectRequestId = parseInt(id);
    if (isNaN(projectRequestId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Obtener todas las cotizaciones con status "Revisión Ok" (statusId = 9)
    const quotations = await prisma.projectRequestCompany.findMany({
      where: {
        projectRequestId: projectRequestId,
        statusId: 9, // Status "Revisión Ok"
        isActive: true,
        isDeleted: false,
      },
      include: {
        Company: {
          select: {
            id: true,
            comercialName: true,
          },
        },
        Quotation: true,
      },
    });

    // Transformar los datos para la respuesta
    const formattedQuotations: FormattedQuotation[] = quotations.map((item) => ({
      id: item.id,
      companyId: item.Company?.id || 0,
      companyName: item.Company?.comercialName || "Empresa sin nombre",
      materialCost: item.Quotation?.materialCost || 0,
      directCost: item.Quotation?.directCost || 0,
      indirectCost: item.Quotation?.indirectCost || 0,
      totalCost: (item.Quotation?.materialCost || 0) + (item.Quotation?.directCost || 0) + (item.Quotation?.indirectCost || 0),
      isSelected: item.Quotation?.isClientSelected || false,
    }));

    return NextResponse.json(formattedQuotations);
  } catch (error: any) {
    console.error("Error al obtener cotizaciones aprobadas:", error);
    return NextResponse.json(
      { error: "Error al obtener cotizaciones aprobadas" },
      { status: 500 }
    );
  }
}
