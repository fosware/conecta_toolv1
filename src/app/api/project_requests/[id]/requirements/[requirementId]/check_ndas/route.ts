import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; requirementId: string } }
) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener los IDs de la URL
    const { id, requirementId } = await params;
    const projectRequestId = parseInt(id);
    const projectRequirementId = parseInt(requirementId);

    if (isNaN(projectRequestId) || isNaN(projectRequirementId)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
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

    if (!projectRequest || !projectRequest.clientArea || !projectRequest.clientArea.client) {
      return NextResponse.json(
        { error: "Proyecto no encontrado o sin cliente asociado" },
        { status: 404 }
      );
    }

    const clientId = projectRequest.clientArea.client.id;

    // Obtener todas las empresas activas
    const companies = await prisma.company.findMany({
      where: {
        isDeleted: false,
        isActive: true,
      },
      select: {
        id: true,
        companyName: true,
        comercialName: true,
      }
    });

    // Obtener todos los NDAs para este cliente
    const ndas = await prisma.clientCompanyNDA.findMany({
      where: {
        clientId: clientId,
        isDeleted: false,
        isActive: true,
      },
      select: {
        id: true,
        companyId: true,
        ndaSignedFileName: true,
        ndaExpirationDate: true,
      }
    });
    
    // Verificar si hay NDAs para cada empresa
    const result = companies.map(company => {
      // Buscar si la empresa tiene un NDA con este cliente
      const nda = ndas.find(n => n.companyId === company.id);
      const hasNDA = !!nda;
      
      return {
        companyId: company.id,
        hasNDA: hasNDA,
        ndaId: nda?.id || null,
        ndaExpirationDate: nda?.ndaExpirationDate || null,
        ndaFileName: nda?.ndaSignedFileName || null
      };
    });

    return NextResponse.json({ ndaResults: result });
  } catch (error) {
    // Se eliminó el console.error
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
