import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const projectId = parseInt(id);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "ID de proyecto inválido" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { 
        id: projectId,
        isDeleted: false,
      },
      select: {
        drawRequest: true,
        nameDrawRequest: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    if (!project.drawRequest || !project.nameDrawRequest) {
      return NextResponse.json(
        { error: "No hay archivo de dibujo/petición" },
        { status: 404 }
      );
    }

    // Determinar el tipo MIME basado en la extensión
    const extension = project.nameDrawRequest.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (extension) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'dwg':
        contentType = 'application/acad';
        break;
      case 'dxf':
        contentType = 'application/dxf';
        break;
    }

    // Crear headers para la descarga
    const headers = new Headers();
    headers.set(
      "Content-Disposition",
      `inline; filename="${project.nameDrawRequest}"`
    );
    headers.set("Content-Type", contentType);
    headers.set("Content-Length", Buffer.from(project.drawRequest).length.toString());

    // Crear un buffer desde el Uint8Array y devolver la respuesta
    const buffer = Buffer.from(project.drawRequest);
    return new NextResponse(buffer, { headers });

  } catch (error) {
    console.error("[DOWNLOAD_DRAW_REQUEST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al descargar el archivo" },
      { status: 500 }
    );
  }
}
