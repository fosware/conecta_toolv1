import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    // Obtener los IDs de la URL siguiendo las mejores prácticas de Next.js 15
    const routeParams = handleRouteParams(params);
const { id, documentId  } = routeParams;
    const parsedId = parseInt(id);
    const parsedDocumentId = parseInt(documentId);

    if (isNaN(parsedId) || isNaN(parsedDocumentId)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Buscar la empresa asignada
    const projectRequestCompany = await prisma.projectRequestCompany.findUnique({
      where: {
        id: parsedId,
        isDeleted: false,
      },
      include: {
        Company: true
      }
    });

    if (!projectRequestCompany) {
      return NextResponse.json(
        { error: "Empresa asignada no encontrada" },
        { status: 404 }
      );
    }

    // Buscar si existe un NDA firmado para esta compañía
    const clientCompanyNDA = await prisma.clientCompanyNDA.findFirst({
      where: {
        companyId: projectRequestCompany.companyId,
        isActive: true,
        isDeleted: false
      }
    });

    // Verificar que el NDA esté firmado
    if (!clientCompanyNDA) {
      return NextResponse.json(
        { error: "No se puede acceder a los documentos sin un NDA firmado" },
        { status: 403 }
      );
    }

    // Obtener el documento
    const document = await prisma.projectRequestRequirementDocuments.findUnique({
      where: {
        id: parsedDocumentId,
        isDeleted: false,
      }
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
    const fileName = 
      document.documentFileName || `documento-${parsedDocumentId}`;

    if (fileName.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
      contentType = "application/msword";
    } else if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
      contentType = "application/vnd.ms-excel";
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
    console.error("Error al descargar documento:", error);
    return NextResponse.json(
      { error: "Error al descargar el documento" },
      { status: 500 }
    );
  }
}
