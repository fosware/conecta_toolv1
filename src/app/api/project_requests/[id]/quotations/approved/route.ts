import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "@/lib/auth";

// Definir la interfaz para las cotizaciones formateadas
interface FormattedQuotation {
  id: number;
  companyId: number;
  companyName: string;
  materialCost: number | null;
  directCost: number | null;
  indirectCost: number | null;
  price: number | null;
  totalCost: number;
  isClientSelected: boolean;
  isClientApproved: boolean;
  requirementId: number;
  requirementName: string;
  statusId: number;
}

interface RequirementWithQuotations {
  id: number;
  requirementName: string;
  quotations: FormattedQuotation[];
}

// Obtener cotizaciones para una solicitud de proyecto
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

    // Obtener todos los requerimientos del proyecto
    const requirements = await prisma.projectRequirements.findMany({
      where: {
        projectRequestId: projectRequestId,
        isDeleted: false,
      },
      select: {
        id: true,
        requirementName: true,
      },
    });

    console.log(`Requerimientos encontrados: ${requirements.length}`);

    // Obtener todas las cotizaciones de asociados seleccionados con cotización enviada
    const quotations = await prisma.projectRequestCompany.findMany({
      where: {
        projectRequirementsId: {
          in: requirements.map(req => req.id),
        },
        // Asociados seleccionados (statusId >= 6 significa que fueron seleccionados)
        statusId: {
          gte: 6, // Status mayor o igual a 6 (seleccionado)
        },
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
        ProjectRequirements: {
          select: {
            id: true,
            requirementName: true,
          }
        }
      },
    });

    console.log(`Cotizaciones encontradas: ${quotations.length}`);

    // Filtrar solo las cotizaciones que tienen datos de cotización
    const filteredQuotations = quotations.filter(item => item.Quotation !== null);

    console.log(`Cotizaciones con datos: ${filteredQuotations.length}`);

    // Transformar los datos para la respuesta
    const formattedQuotations: FormattedQuotation[] = filteredQuotations.map((item) => ({
      id: item.id,
      companyId: item.Company?.id || 0,
      companyName: item.Company?.comercialName || "Empresa sin nombre",
      materialCost: item.Quotation?.materialCost ?? null,
      directCost: item.Quotation?.directCost ?? null,
      indirectCost: item.Quotation?.indirectCost ?? null,
      price: item.Quotation?.price ?? null,
      totalCost: 
        (item.Quotation?.materialCost || 0) + 
        (item.Quotation?.directCost || 0) + 
        (item.Quotation?.indirectCost || 0),
      isClientSelected: item.Quotation?.isClientSelected || false,
      isClientApproved: item.Quotation?.isClientApproved || false,
      requirementId: item.projectRequirementsId,
      requirementName: item.ProjectRequirements?.requirementName || "Sin nombre",
      statusId: item.statusId,
    }));

    // Agrupar las cotizaciones por requerimiento
    const requirementsWithQuotations: RequirementWithQuotations[] = requirements.map(req => ({
      id: req.id,
      requirementName: req.requirementName || "Sin nombre",
      quotations: formattedQuotations.filter(q => q.requirementId === req.id)
    }));

    // Filtrar solo los requerimientos que tienen cotizaciones
    const filteredRequirements = requirementsWithQuotations.filter(req => req.quotations.length > 0);

    console.log(`Requerimientos con cotizaciones: ${filteredRequirements.length}`);

    return NextResponse.json(filteredRequirements);
  } catch (error: any) {
    console.error("Error al obtener cotizaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener cotizaciones" },
      { status: 500 }
    );
  }
}
