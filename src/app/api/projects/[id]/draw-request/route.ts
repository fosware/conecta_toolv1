import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  let userId: number;
  try {
    userId = await getUserFromToken();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error de autorización" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const projectId = parseInt(id);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { drawRequest: true, nameDrawRequest: true },
    });

    if (!project?.drawRequest) {
      return NextResponse.json(
        { error: "No se encontró el archivo de solicitud" },
        { status: 404 }
      );
    }

    // Si el archivo está en Uint8Array, convertirlo directamente a Buffer
    const buffer = project.drawRequest instanceof Uint8Array 
      ? Buffer.from(project.drawRequest)
      : Buffer.from(project.drawRequest, 'base64');

    // Intentar determinar el tipo de contenido basado en el nombre del archivo
    let contentType = 'application/octet-stream';
    const fileName = project.nameDrawRequest || 'download';
    if (fileName.toLowerCase().endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (fileName.toLowerCase().match(/\.(jpg|jpeg)$/)) {
      contentType = 'image/jpeg';
    } else if (fileName.toLowerCase().endsWith('.png')) {
      contentType = 'image/png';
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al obtener el archivo" },
      { status: 500 }
    );
  }
}
