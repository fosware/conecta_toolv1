import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string; requirementId: string; documentId: string } }
) {
  try {
    // Validar token
    let userId: number;
    try {
      userId = await getUserFromToken();
    } catch (error) {
      console.error("[AUTH_ERROR]", error);
      return NextResponse.json(
        { error: "No autorizado", details: error instanceof Error ? error.message : "Error desconocido" },
        { status: 401 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Extraer los IDs correctamente
    const { companyId, requirementId, documentId } = await params;
    const parsedCompanyId = parseInt(companyId);
    const parsedRequirementId = parseInt(requirementId);
    const parsedDocumentId = parseInt(documentId);

    if (isNaN(parsedCompanyId) || isNaN(parsedRequirementId) || isNaN(parsedDocumentId)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Verificar que la compañía y el requerimiento existen
    const companyExists = await prisma.company.findUnique({
      where: { id: parsedCompanyId },
    });

    if (!companyExists) {
      return NextResponse.json(
        { error: "Compañía no encontrada" },
        { status: 404 }
      );
    }

    const requirementExists = await prisma.projectRequirements.findUnique({
      where: { id: parsedRequirementId },
    });

    if (!requirementExists) {
      return NextResponse.json(
        { error: "Requerimiento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que la compañía está asociada al requerimiento
    const association = await prisma.projectRequestCompany.findFirst({
      where: {
        companyId: parsedCompanyId,
        projectRequirementsId: parsedRequirementId,
        isDeleted: false,
      },
    });

    if (!association) {
      return NextResponse.json(
        { error: "La compañía no está asociada a este requerimiento" },
        { status: 403 }
      );
    }

    // Obtener el documento
    const document = await prisma.projectRequestRequirementDocuments.findFirst({
      where: {
        id: parsedDocumentId,
        projectRequestCompanyId: association.id,
        isDeleted: false,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el documento tiene contenido
    if (!document.documentFile) {
      return NextResponse.json(
        { error: "El documento no tiene contenido" },
        { status: 404 }
      );
    }

    // Crear una respuesta con el archivo
    const response = new NextResponse(document.documentFile);

    // Determinar el tipo de contenido basado en la extensión del archivo
    let contentType = "application/octet-stream"; // Por defecto
    const fileName = document.documentFileName || `documento-${parsedDocumentId}`;
    
    if (fileName.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else if (fileName.endsWith(".pptx") || fileName.endsWith(".ppt")) {
      contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    } else if (fileName.endsWith(".txt")) {
      contentType = "text/plain";
    } else if (fileName.endsWith(".zip")) {
      contentType = "application/zip";
    } else if (fileName.endsWith(".rar")) {
      contentType = "application/x-rar-compressed";
    }
    
    // Establecer encabezados para la descarga
    response.headers.set("Content-Type", contentType);
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    
    return response;
  } catch (error) {
    console.error("[TECHNICAL_DOCUMENT_DOWNLOAD]", error);
    return NextResponse.json(
      {
        error: "Error al descargar el documento técnico",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
