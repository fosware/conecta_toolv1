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

// Actualizar las cotizaciones seleccionadas para un cliente
export async function POST(
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

    // Obtener los datos del cuerpo de la solicitud
    const data = await request.json();
    const { selectedQuotationIds } = data;

    if (!Array.isArray(selectedQuotationIds)) {
      return NextResponse.json(
        { error: "El formato de los IDs de cotizaciones seleccionadas es inválido" },
        { status: 400 }
      );
    }

    // Iniciar una transacción para asegurar que todas las operaciones se completen o ninguna
    await prisma.$transaction(async (tx) => {
      // 1. Obtener el estado actual de las cotizaciones seleccionadas para preservar sus estados
      const currentSelectedQuotations = await tx.projectRequestCompany.findMany({
        where: {
          projectRequestId: projectRequestId,
          Quotation: {
            isClientSelected: true,
          },
          isActive: true,
          isDeleted: false,
        },
        include: {
          Quotation: true,
        },
      });

      // Crear un mapa de los IDs y sus estados actuales para referencia rápida
      const currentStatusMap = new Map();
      currentSelectedQuotations.forEach(item => {
        if (!selectedQuotationIds.includes(item.id)) {
          // Solo guardamos los que ya no estarán seleccionados
          currentStatusMap.set(item.id, item.statusId);
        }
      });

      // 2. Restablecer isClientSelected solo para las cotizaciones que no están en la nueva selección
      await tx.projectRequestRequirementQuotation.updateMany({
        where: {
          ProjectRequestCompany: {
            projectRequestId: projectRequestId,
            id: {
              notIn: selectedQuotationIds,
            },
          },
        },
        data: {
          isClientSelected: false,
        },
      });

      // 3. Marcar las cotizaciones seleccionadas como isClientSelected = true
      if (selectedQuotationIds.length > 0) {
        for (const quotationId of selectedQuotationIds) {
          await tx.projectRequestRequirementQuotation.update({
            where: {
              projectRequestCompanyId: quotationId,
            },
            data: {
              isClientSelected: true,
            },
          });
        }
      }

      // 4. Restaurar los estados originales de las cotizaciones que fueron deseleccionadas
      for (const [id, statusId] of currentStatusMap.entries()) {
        await tx.projectRequestCompany.update({
          where: {
            id: id,
          },
          data: {
            statusId: statusId,
          },
        });
      }
    });

    // Obtener las cotizaciones actualizadas para devolver en la respuesta
    const updatedQuotations = await prisma.projectRequestCompany.findMany({
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
    const formattedQuotations: FormattedQuotation[] = updatedQuotations.map((item) => ({
      id: item.id,
      companyId: item.Company?.id || 0,
      companyName: item.Company?.comercialName || "Empresa sin nombre",
      materialCost: item.Quotation?.materialCost || 0,
      directCost: item.Quotation?.directCost || 0,
      indirectCost: item.Quotation?.indirectCost || 0,
      totalCost: (item.Quotation?.materialCost || 0) + (item.Quotation?.directCost || 0) + (item.Quotation?.indirectCost || 0),
      isSelected: item.Quotation?.isClientSelected || false,
    }));

    return NextResponse.json({
      message: "Cotizaciones seleccionadas actualizadas correctamente",
      quotations: formattedQuotations,
    });
  } catch (error: any) {
    console.error("Error al actualizar cotizaciones seleccionadas:", error);
    return NextResponse.json(
      { error: "Error al actualizar cotizaciones seleccionadas" },
      { status: 500 }
    );
  }
}
