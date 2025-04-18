import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extraer el ID correctamente
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

    // Obtener la cotización con el archivo
    const quotation = await prisma.projectRequestRequirementQuotation.findUnique({
      where: {
        projectRequestCompanyId: parsedId,
        isActive: true,
      },
      select: {
        quotationFile: true,
        quotationFileName: true,
      }
    });

    if (!quotation) {
      return NextResponse.json(
        { 
          available: false,
          message: "No hay cotización disponible para descargar" 
        },
        { status: 200 }
      );
    }

    // Verificar que existe un archivo
    if (!quotation.quotationFile) {
      return NextResponse.json(
        { 
          available: false,
          message: "La cotización no tiene un archivo asociado" 
        },
        { status: 200 }
      );
    }

    // Crear respuesta con el archivo
    const response = new NextResponse(quotation.quotationFile);

    // Determinar el tipo de contenido basado en la extensión del archivo
    let contentType = "application/octet-stream"; // Por defecto
    const fileName = quotation.quotationFileName || `cotizacion-${parsedId}.pdf`;

    if (fileName.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else if (fileName.endsWith(".pptx")) {
      contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    } else if (fileName.endsWith(".txt")) {
      contentType = "text/plain";
    } else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
      contentType = "image/jpeg";
    } else if (fileName.endsWith(".png")) {
      contentType = "image/png";
    }

    // Establecer encabezados para la descarga
    response.headers.set("Content-Type", contentType);
    
    // Usar Content-Disposition para forzar la descarga
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );

    // Agregar encabezados de seguridad
    response.headers.set("Content-Security-Policy", "default-src 'self'");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Cache-Control", "no-store, max-age=0");

    return response;
  } catch (error) {
    console.error(
      "Error en GET /api/assigned_companies/[id]/download-quote:",
      error
    );
    return NextResponse.json(
      { error: "Error al descargar la cotización" },
      { status: 500 }
    );
  }
}
