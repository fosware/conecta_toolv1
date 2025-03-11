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
      include: {
        Documents: {
          where: {
            isDeleted: false,
            isActive: true,
          },
        },
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

    // Devolver los documentos
    return NextResponse.json({
      documents: projectRequestCompany.Documents ? [projectRequestCompany.Documents] : [],
    });
  } catch (error) {
    console.error("Error en GET /api/assigned_companies/[id]/documents:", error);
    return NextResponse.json(
      { error: "Error al obtener los documentos" },
      { status: 500 }
    );
  }
}
