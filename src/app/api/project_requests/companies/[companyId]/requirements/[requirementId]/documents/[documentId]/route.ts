import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: { companyId: string; requirementId: string; documentId: string };
  }
) {
  try {
    // Validar token
    let userId: number;
    try {
      userId = await getUserFromToken();
    } catch (error) {
      console.error("[AUTH_ERROR]", error);
      return NextResponse.json(
        {
          error: "No autorizado",
          details: error instanceof Error ? error.message : "Error desconocido",
        },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Extraer los IDs correctamente
    const { companyId, requirementId, documentId } = await params;
    const parsedCompanyId = parseInt(companyId);
    const parsedRequirementId = parseInt(requirementId);
    const parsedDocumentId = parseInt(documentId);

    if (
      isNaN(parsedCompanyId) ||
      isNaN(parsedRequirementId) ||
      isNaN(parsedDocumentId)
    ) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    // Verificar que la compañía y el requerimiento existen
    const companyExists = await prisma.company.findUnique({
      where: { id: parsedCompanyId },
    });

    if (!companyExists) {
      return NextResponse.json(
        { error: "Compañía no encontrada" },
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

    if (!association) {
      return NextResponse.json(
        { error: "La compañía no está asociada a este requerimiento" },
        { status: 403 }
      );
    }

    // Verificar que el documento existe
    const document = await prisma.projectRequestDocuments.findFirst({
      where: {
        id: parsedDocumentId,
        projectRequestId: requirementExists.projectRequestId,
        isDeleted: false,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      );
    }

    // Marcar el documento como eliminado (borrado lógico)
    await prisma.projectRequestDocuments.update({
      where: {
        id: parsedDocumentId,
      },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
      },
    });

    // Verificar si quedan documentos activos para esta asociación
    //console.log("[TECHNICAL_DOCUMENT_DELETE] Verificando si quedan documentos activos");
    const remainingDocuments =
      await prisma.projectRequestDocuments.count({
        where: {
          projectRequestId: requirementExists.projectRequestId,
          isDeleted: false,
        },
      });

    //console.log("[TECHNICAL_DOCUMENT_DELETE] Documentos restantes:", remainingDocuments);

    // Si no quedan documentos, cambiar el estado a "En espera de Documentos Técnicos" (ID 5)
    if (remainingDocuments === 0) {
      //console.log("[TECHNICAL_DOCUMENT_DELETE] No quedan documentos, cambiando estado a 'En espera de Documentos Técnicos' (ID 5)");
      await prisma.projectRequestCompany.update({
        where: {
          id: association.id,
        },
        data: {
          statusId: 5, // ID 5 corresponde a "En espera de Documentos Técnicos"
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Documento eliminado correctamente",
    });
  } catch (error) {
    console.error("[TECHNICAL_DOCUMENT_DELETE]", error);
    return NextResponse.json(
      {
        error: "Error al eliminar el documento técnico",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
