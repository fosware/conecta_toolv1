import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { ProjectRequestLogsService } from "@/lib/services/project-request-logs";

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

    // Actualizar el estado del proyecto a "Cotización enviada al Cliente" (statusId: 11)
    await prisma.projectRequest.update({
      where: {
        id: projectRequestId,
      },
      data: {
        statusId: 11, // ID del estado "Cotización enviada al Cliente"
      },
    });

    // Actualizar la fecha de envío en la cotización del cliente
    await prisma.clientQuotationSummary.update({
      where: {
        id: clientQuotation.id,
      },
      data: {
        dateQuotationSent: new Date(),
      },
    });

    // Crear un log automático del sistema para registrar el envío de la cotización al cliente
    await ProjectRequestLogsService.createSystemLog(
      projectRequestId,
      "CLIENT_QUOTATION_SENT",
      userId,
      true // Indicar que es un log a nivel de proyecto
    );

    return NextResponse.json({
      message: "Cotización enviada al cliente correctamente",
      success: true,
    });
  } catch (error) {
    console.error("Error al enviar cotización al cliente:", error);
    return NextResponse.json(
      { error: "Error al enviar cotización al cliente" },
      { status: 500 }
    );
  }
}
