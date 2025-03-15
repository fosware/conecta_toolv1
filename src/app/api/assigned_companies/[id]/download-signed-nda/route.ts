import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente según las prácticas de Next.js 15
    const { id } = params;
    const parsedId = parseInt(id);

    // Verificar autenticación
    // const session = await getServerSession(authOptions);
    if (false) { // Autenticación deshabilitada temporalmente
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener el registro
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

    // Verificar que existe un archivo NDA firmado
    if (!projectRequestCompany.ndaSignedFile) {
      return NextResponse.json(
        { error: "No hay un NDA firmado disponible para descargar" },
        { status: 404 }
      );
    }

    // Crear respuesta con el archivo
    const response = new NextResponse(projectRequestCompany.ndaSignedFile);
    
    // Establecer encabezados para la descarga
    response.headers.set("Content-Type", "application/pdf");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${projectRequestCompany.ndaSignedFileName || 'nda-firmado.pdf'}"`
    );

    return response;
  } catch (error) {
    console.error("Error en GET /api/assigned_companies/[id]/download-signed-nda:", error);
    return NextResponse.json(
      { error: "Error al descargar el NDA firmado" },
      { status: 500 }
    );
  }
}
