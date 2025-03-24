import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { ProjectRequestLogsService } from "@/lib/services/project-request-logs";

/**
 * Endpoint para rechazar una cotización por parte del cliente
 * Actualiza el estado del proyecto a "Cotización rechazada por Cliente" (statusId: 13)
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

    // Obtener datos del cuerpo (razón del rechazo)
    const data = await request.json();
    const { rejectionReason } = data;

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

    // Verificar que la cotización no haya sido ya rechazada
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

    if (projectRequest.statusId === 13) {
      return NextResponse.json(
        { error: "La cotización ya ha sido rechazada por el cliente" },
        { status: 400 }
      );
    }

    // Actualizar el estado del proyecto a "Cotización rechazada por Cliente" (statusId: 13)
    await prisma.projectRequest.update({
      where: {
        id: projectRequestId,
      },
      data: {
        statusId: 13, // ID del estado "Cotización rechazada por Cliente"
      },
    });

    // Actualizar la observación en la cotización del cliente con la razón del rechazo
    // Ya que no existe el campo dateQuotationRejected en el modelo
    await prisma.clientQuotationSummary.update({
      where: {
        id: clientQuotation.id,
      },
      data: {
        observations: `Cotización rechazada el ${new Date().toISOString()}. Razón: ${rejectionReason || "No se especificó una razón"}`,
      },
    });

    // Crear un log automático del sistema para registrar el rechazo de la cotización por el cliente
    await ProjectRequestLogsService.createSystemLog(
      projectRequestId,
      "CLIENT_QUOTATION_REJECTED",
      userId,
      true // Indicar que es un log a nivel de proyecto
    );

    return NextResponse.json({
      message: "Cotización rechazada por el cliente correctamente",
      success: true,
    });
  } catch (error) {
    console.error("Error al rechazar cotización:", error);
    return NextResponse.json(
      { error: "Error al rechazar la cotización" },
      { status: 500 }
    );
  }
}
