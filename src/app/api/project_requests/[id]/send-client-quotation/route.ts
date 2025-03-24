import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "@/lib/auth";

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

    return NextResponse.json({
      message: "Cotización enviada al cliente correctamente",
      success: true,
    });
  } catch (error: any) {
    console.error("Error al enviar cotización al cliente:", error);
    return NextResponse.json(
      { error: "Error al enviar cotización al cliente" },
      { status: 500 }
    );
  }
}
