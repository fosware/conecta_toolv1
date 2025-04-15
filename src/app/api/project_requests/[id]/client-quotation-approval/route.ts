import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { ProjectRequestLogsService } from "@/lib/services/project-request-logs";

/**
 * Endpoint para aprobar una cotización por parte del cliente
 * Actualiza el estado del proyecto a "Cotización seleccionada" (statusId: 13)
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

    // Verificar que la cotización no haya sido ya seleccionada
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
        { error: "La cotización ya ha sido seleccionada" },
        { status: 400 }
      );
    }

    // Actualizar el estado del proyecto a "Cotización seleccionada" (statusId: 13)
    await prisma.projectRequest.update({
      where: {
        id: projectRequestId,
      },
      data: {
        statusId: 13, // ID del estado "Cotización seleccionada"
      },
    });

    // Actualizar la cotización del cliente con una observación sobre la selección
    // Ya que no existe el campo dateQuotationApproved en el modelo
    await prisma.clientQuotationSummary.update({
      where: {
        id: clientQuotation.id,
      },
      data: {
        observations: `Cotización seleccionada el ${new Date().toISOString()}`,
      },
    });

    // Crear un log automático del sistema para registrar la selección de la cotización por el cliente
    await ProjectRequestLogsService.createSystemLog(
      projectRequestId,
      "CLIENT_QUOTATION_SELECTED",
      userId,
      true // Indicar que es un log a nivel de proyecto
    );

    return NextResponse.json({
      message: "Cotización seleccionada correctamente",
      success: true,
    });
  } catch (error) {
    console.error("Error al seleccionar cotización:", error);
    return NextResponse.json(
      { error: "Error al seleccionar la cotización" },
      { status: 500 }
    );
  }
}
