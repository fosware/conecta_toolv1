import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string, requirementId: string } }
) {
  try {
    console.log("[TECHNICAL_DOCUMENTS_LIST] Iniciando carga de documentos");
    // Validar token
    let userId: number;
    try {
      userId = await getUserFromToken();
    } catch (error) {
      console.error("[AUTH_ERROR]", error);
      return NextResponse.json(
        { error: "No autorizado", details: error instanceof Error ? error.message : "Error desconocido" },
        { status: 401 }
      );
    }
    
    if (!userId) {
      console.log("[TECHNICAL_DOCUMENTS_LIST] No se encontró un token válido");
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Extraer los IDs correctamente
    const { companyId, requirementId } = await params;
    console.log("[TECHNICAL_DOCUMENTS_LIST] IDs recibidos:", { companyId, requirementId });
    const parsedCompanyId = parseInt(companyId);
    const parsedRequirementId = parseInt(requirementId);
    console.log("[TECHNICAL_DOCUMENTS_LIST] IDs parseados:", { parsedCompanyId, parsedRequirementId });

    if (isNaN(parsedCompanyId) || isNaN(parsedRequirementId)) {
      return NextResponse.json(
        { error: "IDs de compañía o requerimiento inválidos" },
        { status: 400 }
      );
    }

    // Verificar que la compañía y el requerimiento existen
    console.log("[TECHNICAL_DOCUMENTS_LIST] Buscando compañía con ID:", parsedCompanyId);
    const companyExists = await prisma.company.findUnique({
      where: { 
        id: parsedCompanyId,
      },
    });
    console.log("[TECHNICAL_DOCUMENTS_LIST] Resultado de búsqueda de compañía:", companyExists);

    if (!companyExists) {
      console.log("[TECHNICAL_DOCUMENTS_LIST] Compañía no encontrada");
      return NextResponse.json(
        { error: "Compañía no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si la compañía está activa y no eliminada
    if (!companyExists.isActive || companyExists.isDeleted) {
      console.log("[TECHNICAL_DOCUMENTS_LIST] Compañía inactiva o eliminada");
      return NextResponse.json(
        { error: "Compañía inactiva o eliminada" },
        { status: 404 }
      );
    }

    const requirementExists = await prisma.projectRequirements.findUnique({
      where: { id: parsedRequirementId },
    });

    if (!requirementExists) {
      return NextResponse.json(
        { error: "Requerimiento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que la compañía está asociada al requerimiento
    const association = await prisma.projectRequestCompany.findFirst({
      where: {
        companyId: parsedCompanyId,
        projectRequirementsId: parsedRequirementId,
        isDeleted: false,
      },
    });
    console.log("[TECHNICAL_DOCUMENTS_LIST] Asociación encontrada:", association);

    if (!association) {
      return NextResponse.json(
        { error: "La compañía no está asociada a este requerimiento" },
        { status: 403 }
      );
    }

    // Obtener los documentos técnicos (sin incluir el contenido del archivo)
    const documents = await prisma.projectRequestRequirementDocuments.findMany({
      where: {
        projectRequestCompanyId: association.id,
        isDeleted: false,
      },
      select: {
        id: true,
        documentFileName: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log("[TECHNICAL_DOCUMENTS_LIST] Documentos encontrados:", documents.length);

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error("[TECHNICAL_DOCUMENTS_LIST]", error);
    return NextResponse.json(
      {
        error: "Error al obtener los documentos técnicos",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
