import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el ID del NDA
    const { id } = await params;
    const ndaId = parseInt(id);

    if (isNaN(ndaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Buscar el NDA en la base de datos
    const nda = await prisma.clientCompanyNDA.findUnique({
      where: {
        id: ndaId,
        isDeleted: false,
      },
    });

    if (!nda) {
      return NextResponse.json({ error: "NDA no encontrado" }, { status: 404 });
    }

    // Verificar que el NDA tenga un archivo
    if (!nda.ndaSignedFile) {
      return NextResponse.json(
        { error: "El archivo NDA no está disponible" },
        { status: 404 }
      );
    }

    // Crear una respuesta con el archivo
    const response = new NextResponse(nda.ndaSignedFile);
    
    // Configurar los encabezados para la descarga
    response.headers.set("Content-Type", "application/pdf");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${nda.ndaSignedFileName}"`
    );

    return response;
  } catch (error) {
    console.error("Error al descargar NDA:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
