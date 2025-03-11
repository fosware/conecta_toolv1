import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente según las mejores prácticas de Next.js 15
    const { id } = await params;
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

    // Verificar que existe un archivo NDA
    if (!projectRequestCompany.ndaFile) {
      return NextResponse.json(
        { error: "No hay un NDA disponible para descargar" },
        { status: 404 }
      );
    }

    // Crear respuesta con el archivo
    const response = new NextResponse(projectRequestCompany.ndaFile);
    
    // Establecer encabezados para la descarga
    response.headers.set("Content-Type", "application/pdf");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${projectRequestCompany.ndaFileName || 'nda.pdf'}"`
    );

    return response;
  } catch (error) {
    console.error("Error en GET /api/assigned_companies/[id]/download-nda:", error);
    return NextResponse.json(
      { error: "Error al descargar el NDA" },
      { status: 500 }
    );
  }
}
