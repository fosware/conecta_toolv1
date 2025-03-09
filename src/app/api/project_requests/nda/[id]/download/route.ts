import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente según las prácticas de Next.js 15
    const { id } = await params;
    const parsedId = parseInt(id);
    
    // Verificar que el ID sea válido
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Obtener el usuario desde el token (opcional)
    const userId = await getUserFromToken();

    // Buscar el registro de la empresa participante
    const projectRequestCompany = await prisma.projectRequestCompany.findFirst({
      where: {
        id: parsedId,
        isActive: true,
        isDeleted: false,
      },
      select: {
        ndaFile: true,
        ndaFileName: true,
      },
    });

    if (!projectRequestCompany || !projectRequestCompany.ndaFile) {
      return NextResponse.json(
        { error: "Archivo NDA no encontrado" },
        { status: 404 }
      );
    }

    // Crear headers para la descarga
    const headers = new Headers();
    headers.set(
      "Content-Disposition",
      `attachment; filename="${projectRequestCompany.ndaFileName || 'nda.pdf'}"`
    );
    headers.set("Content-Type", "application/octet-stream");

    // Devolver el archivo como respuesta
    return new NextResponse(projectRequestCompany.ndaFile, {
      headers,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al descargar el archivo NDA" },
      { status: 500 }
    );
  }
}
