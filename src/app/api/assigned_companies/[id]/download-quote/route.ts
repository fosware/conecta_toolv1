import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente según las mejores prácticas de Next.js 15
    const { id } = await params;
    const parsedId = parseInt(id);

    // Verificar autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token || !token.value) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el registro de ProjectRequestCompany
    const projectRequestCompany = await prisma.projectRequestCompany.findUnique(
      {
        where: {
          id: parsedId,
          isDeleted: false,
        },
      }
    );

    if (!projectRequestCompany) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      );
    }

    // Obtener la cotización
    const quotation = await prisma.projectRequestRequirementQuotation.findUnique(
      {
        where: {
          projectRequestCompanyId: parsedId,
          isDeleted: false,
          isActive: true,
        },
      }
    );

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
    const fileName =
      quotation.quotationFileName || `cotizacion-${parsedId}`;

    if (fileName.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      contentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else if (fileName.endsWith(".pptx")) {
      contentType =
        "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    } else if (fileName.endsWith(".txt")) {
      contentType = "text/plain";
    } else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
      contentType = "image/jpeg";
    } else if (fileName.endsWith(".png")) {
      contentType = "image/png";
    }

    // Establecer encabezados para la descarga
    response.headers.set("Content-Type", contentType);
    
    // Asegurarse de que el nombre del archivo no contenga caracteres que puedan causar problemas
    const safeFileName = fileName.replace(/[^\w\s.-]/g, '');
    
    // Codificar el nombre del archivo para manejar espacios y caracteres especiales
    const encodedFilename = encodeURIComponent(safeFileName);
    
    // Usar un formato de Content-Disposition más simple y directo
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${safeFileName}"`
    );

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
