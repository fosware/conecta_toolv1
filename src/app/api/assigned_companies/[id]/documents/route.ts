import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extraer el ID correctamente
    const { id } = await params;
    const parsedId = parseInt(id);

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
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

    // Devolver los documentos
    return NextResponse.json({
      documents: projectRequestCompany.Documents || [],
    });
  } catch (error) {
    console.error("Error en GET /api/assigned_companies/[id]/documents:", error);
    return NextResponse.json(
      { error: "Error al obtener los documentos" },
      { status: 500 }
    );
  }
}
