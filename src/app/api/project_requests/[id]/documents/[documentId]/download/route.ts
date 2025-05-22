import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    // Extraer los IDs correctamente (Next.js 15)
    const { id, documentId } = await params;
    const projectRequestId = parseInt(id);
    const docId = parseInt(documentId);

    // Verificar que los IDs sean válidos
    if (isNaN(projectRequestId) || isNaN(docId)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Obtener el documento técnico
    const document = await prisma.projectRequestDocuments.findFirst({
      where: {
        id: docId,
        projectRequestId,
        isDeleted: false,
        isActive: true,
      },
    });

    if (!document || !document.documentFile) {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      );
    }

    // Configurar los encabezados para la descarga
    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename="${document.documentFileName}"`);
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Security-Policy", "default-src 'self'");
    headers.set("X-Content-Type-Options", "nosniff");

    // Devolver el archivo como respuesta
    return new NextResponse(document.documentFile, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error al descargar documento técnico:", error);
    return NextResponse.json(
      { error: "Error al descargar documento técnico" },
      { status: 500 }
    );
  }
}
