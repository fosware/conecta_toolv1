import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Obtener la cotización para cliente
    const clientQuotation = await prisma.clientQuotationSummary.findFirst({
      where: {
        projectRequestId: projectRequestId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!clientQuotation || !clientQuotation.quotationFile) {
      return NextResponse.json(
        { error: "No se encontró el archivo de cotización" },
        { status: 404 }
      );
    }

    // Determinar el tipo de contenido basado en la extensión del archivo
    const fileName = clientQuotation.quotationFileName || "cotizacion-cliente.xlsx";
    const fileExtension = fileName.split(".").pop()?.toLowerCase();
    
    let contentType = "application/octet-stream";
    if (fileExtension === "pdf") {
      contentType = "application/pdf";
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else if (fileExtension === "doc" || fileExtension === "docx") {
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }

    // Crear una respuesta con el archivo
    const response = new NextResponse(clientQuotation.quotationFile);
    
    // Configurar las cabeceras de la respuesta
    response.headers.set("Content-Type", contentType);
    response.headers.set("Content-Disposition", `attachment; filename="${fileName}"`);
    
    return response;
  } catch (error: any) {
    console.error("Error al descargar cotización para cliente:", error);
    return NextResponse.json(
      { error: "Error al descargar cotización para cliente" },
      { status: 500 }
    );
  }
}
