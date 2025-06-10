import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string; requirementId: string } }
) {
  try {
    // Se eliminaron los logs de depuración
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
      // Se eliminaron los logs de depuración
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Extraer los IDs correctamente
    const { companyId, requirementId } = await params;
    // Se eliminaron los logs de depuración
    const parsedCompanyId = parseInt(companyId);
    const parsedRequirementId = parseInt(requirementId);
    // Se eliminaron los logs de depuración

    if (isNaN(parsedCompanyId) || isNaN(parsedRequirementId)) {
      return NextResponse.json(
        { error: "IDs de compañía o requerimiento inválidos" },
        { status: 400 }
      );
    }

    // Verificar que la compañía y el requerimiento existen
    // Se eliminaron los logs de depuración
    const companyExists = await prisma.company.findUnique({
      where: {
        id: parsedCompanyId,
      },
    });
    // Se eliminaron los logs de depuración

    if (!companyExists) {
      // Se eliminaron los logs de depuración
      return NextResponse.json(
        { error: "Compañía no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si la compañía está activa y no eliminada
    if (!companyExists.isActive || companyExists.isDeleted) {
      // Se eliminaron los logs de depuración
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
    // Se eliminaron los logs de depuración

    if (!association) {
      return NextResponse.json(
        { error: "La compañía no está asociada a este requerimiento" },
        { status: 403 }
      );
    }

    // Obtener los documentos técnicos (sin incluir el contenido del archivo)
    const documents = await prisma.projectRequestDocuments.findMany({
      where: {
        projectRequestId: requirementExists.projectRequestId,
        isDeleted: false,
      },
      select: {
        id: true,
        documentFileName: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    // Se eliminaron los logs de depuración

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
