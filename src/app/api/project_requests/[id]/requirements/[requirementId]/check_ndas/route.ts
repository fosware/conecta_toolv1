import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; requirementId: string } }
) {
  try {
    // Obtener IDs del proyecto y requerimiento
    const { id, requirementId } = await params;
    const projectRequestId = parseInt(id);
    const projectRequirementId = parseInt(requirementId);

    if (isNaN(projectRequestId) || isNaN(projectRequirementId)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    // Obtener el proyecto para saber el cliente
    const projectRequest = await prisma.projectRequest.findUnique({
      where: {
        id: projectRequestId,
        isDeleted: false,
      },
      include: {
        clientArea: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!projectRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    // Obtener todas las empresas (asociados)
    const companies = await prisma.company.findMany({
      where: {
        isDeleted: false,
        isActive: true,
      },
      select: {
        id: true,
        comercialName: true,
      },
    });

    const clientId = projectRequest.clientArea.client.id;
    
    // Obtener la fecha actual para verificar NDAs válidos
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verificar NDAs para cada empresa
    const ndaResults = await Promise.all(
      companies.map(async (company) => {
        // Buscar directamente en la base de datos si existe un NDA válido para este asociado
        const validNDA = await prisma.clientCompanyNDA.findFirst({
          where: {
            // Ignoramos el clientId para permitir que un asociado use el mismo NDA con diferentes clientes
            companyId: company.id,
            isActive: true,
            isDeleted: false,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (validNDA) {
          return {
            companyId: company.id,
            hasNDA: true,
            ndaId: validNDA.id,
            ndaExpirationDate: validNDA.ndaExpirationDate,
            ndaFileName: validNDA.ndaSignedFileName,
          };
        } else {
          return {
            companyId: company.id,
            hasNDA: false,
            ndaId: null,
            ndaExpirationDate: null,
            ndaFileName: null,
          };
        }
      })
    );

    return NextResponse.json({ ndaResults });
  } catch (error) {
    console.error("Error al verificar NDAs:", error);
    return NextResponse.json(
      { error: "Error al verificar NDAs" },
      { status: 500 }
    );
  }
}
