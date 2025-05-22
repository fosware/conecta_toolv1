import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

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
        ProjectRequirements: {
          include: {
            ProjectRequest: true
          }
        }
      }
    });

    if (!projectRequestCompany) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      );
    }
    
    // Obtener los documentos asociados a la solicitud de proyecto
    const projectRequestId = projectRequestCompany.ProjectRequirements?.ProjectRequest?.id;
    
    if (!projectRequestId) {
      return NextResponse.json({
        documents: [],
      });
    }
    
    // Buscar los documentos usando el nuevo modelo
    const documents = await prisma.projectRequestDocuments.findMany({
      where: {
        projectRequestId: projectRequestId,
        isDeleted: false,
      },
      select: {
        id: true,
        documentFileName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Devolver los documentos
    return NextResponse.json({
      documents: documents,
    });
  } catch (error) {
    console.error("Error en GET /api/assigned_companies/[id]/documents:", error);
    return NextResponse.json(
      { error: "Error al obtener los documentos" },
      { status: 500 }
    );
  }
}
