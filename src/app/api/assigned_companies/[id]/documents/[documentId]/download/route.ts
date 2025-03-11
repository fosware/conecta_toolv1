import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    // Extraer los IDs correctamente según las mejores prácticas de Next.js 15
    const { id, documentId } = await params;
    const parsedId = parseInt(id);
    const parsedDocumentId = parseInt(documentId);

    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener el registro de ProjectRequestCompany
    const projectRequestCompany = await prisma.projectRequestCompany.findUnique({
      where: {
        id: parsedId,
        isDeleted: false,
      },
    });

    if (!projectRequestCompany) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el NDA esté firmado
    if (!projectRequestCompany.ndaSignedFile) {
      return NextResponse.json(
        { error: "No se puede acceder a los documentos sin un NDA firmado" },
        { status: 403 }
      );
    }

    // Obtener el documento
    const document = await prisma.projectRequestRequirementDocuments.findUnique({
      where: {
        id: parsedDocumentId,
        projectRequestCompanyId: parsedId,
        isDeleted: false,
        isActive: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que existe un archivo
    if (!document.documentFile) {
      return NextResponse.json(
        { error: "El documento no tiene un archivo asociado" },
        { status: 404 }
      );
    }

    // Crear respuesta con el archivo
    const response = new NextResponse(document.documentFile);
    
    // Determinar el tipo de contenido basado en la extensión del archivo
    let contentType = "application/octet-stream"; // Por defecto
    const fileName = document.documentFileName || `documento-${parsedDocumentId}`;
    
    if (fileName.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (fileName.endsWith(".docx")) {
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (fileName.endsWith(".xlsx")) {
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
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );

    return response;
  } catch (error) {
    console.error("Error en GET /api/assigned_companies/[id]/documents/[documentId]/download:", error);
    return NextResponse.json(
      { error: "Error al descargar el documento" },
      { status: 500 }
    );
  }
}
