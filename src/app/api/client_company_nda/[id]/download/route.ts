import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { NextRequest, NextResponse } from "next/server";

// GET: Descargar el archivo NDA original
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente
    const { id } = await params;
    const ndaId = parseInt(id);

    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Buscar el NDA por ID
    const nda = await prisma.clientCompanyNDA.findUnique({
      where: { id: ndaId },
      select: {
        ndaFile: true,
        ndaFileName: true,
      },
    });

    if (!nda || !nda.ndaFile || !nda.ndaFileName) {
      return NextResponse.json(
        { 
          success: false,
          error: "Archivo no encontrado" 
        },
        { status: 404 }
      );
    }

    // Crear la respuesta con el archivo
    const response = new NextResponse(nda.ndaFile);
    
    // Establecer los encabezados adecuados para la descarga
    response.headers.set("Content-Type", "application/octet-stream");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${nda.ndaFileName}"`
    );

    return response;
  } catch (error) {
    console.error("[CLIENT_COMPANY_NDA_DOWNLOAD]", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Error al descargar el archivo" 
      },
      { status: 500 }
    );
  }
}
