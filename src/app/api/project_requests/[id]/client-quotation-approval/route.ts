import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { ProjectRequestLogsService } from "@/lib/services/project-request-logs";

/**
 * Endpoint para aprobar una cotización por parte del cliente
 * Actualiza el estado del proyecto a "Cotización aprobada por Cliente" (statusId: 12)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar autenticación y obtener usuario
    const userId = await getUserFromToken();
    if (!userId) {
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

    // Verificar que exista una cotización para cliente
    const clientQuotation = await prisma.clientQuotationSummary.findFirst({
      where: {
        projectRequestId: projectRequestId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!clientQuotation) {
      return NextResponse.json(
        { error: "No se encontró una cotización para cliente" },
        { status: 404 }
      );
    }

    // Verificar que la cotización no haya sido ya aprobada
    const projectRequest = await prisma.projectRequest.findUnique({
      where: {
        id: projectRequestId,
      },
    });

    if (!projectRequest) {
      return NextResponse.json(
        { error: "No se encontró la solicitud de proyecto" },
        { status: 404 }
      );
    }

    if (projectRequest.statusId === 12) {
      return NextResponse.json(
        { error: "La cotización ya ha sido aprobada por el cliente" },
        { status: 400 }
      );
    }

    // Actualizar el estado del proyecto a "Cotización aprobada por Cliente" (statusId: 12)
    await prisma.projectRequest.update({
      where: {
        id: projectRequestId,
      },
      data: {
        statusId: 12, // ID del estado "Cotización aprobada por Cliente"
      },
    });

    // Actualizar la cotización del cliente con una observación sobre la aprobación
    // Ya que no existe el campo dateQuotationApproved en el modelo
    await prisma.clientQuotationSummary.update({
      where: {
        id: clientQuotation.id,
      },
      data: {
        observations: `Cotización aprobada el ${new Date().toISOString()}`,
      },
    });

    // Crear un log automático del sistema para registrar la aprobación de la cotización por el cliente
    await ProjectRequestLogsService.createSystemLog(
      projectRequestId,
      "CLIENT_QUOTATION_APPROVED",
      userId,
      true // Indicar que es un log a nivel de proyecto
    );

    return NextResponse.json({
      message: "Cotización aprobada por el cliente correctamente",
      success: true,
    });
  } catch (error) {
    console.error("Error al aprobar cotización:", error);
    return NextResponse.json(
      { error: "Error al aprobar la cotización" },
      { status: 500 }
    );
  }
}
