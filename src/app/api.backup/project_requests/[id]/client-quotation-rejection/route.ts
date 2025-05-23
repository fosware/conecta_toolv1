import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { ProjectRequestLogsService } from "@/lib/services/project-request-logs";

/**
 * Endpoint para rechazar una cotización por parte del cliente
 * Actualiza el estado del proyecto a "Cotización rechazada por Cliente" (statusId: 13)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar autenticación y obtener usuario
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener y validar el ID del proyecto
    const { id } = await params;
    const projectRequestId = parseInt(id);
    if (isNaN(projectRequestId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Obtener datos del cuerpo de la solicitud
    const data = await request.json();
    const { quotationId, rejectionReason } = data;

    if (!quotationId) {
      return NextResponse.json(
        { error: "ID de cotización requerido" },
        { status: 400 }
      );
    }

    if (!rejectionReason) {
      return NextResponse.json(
        { error: "Motivo de rechazo requerido" },
        { status: 400 }
      );
    }

    // Verificar que la cotización exista
    const quotation = await prisma.projectRequestRequirementQuotation.findUnique({
      where: {
        projectRequestCompanyId: quotationId,
      },
      include: {
        ProjectRequestCompany: {
          include: {
            ProjectRequirements: {
              select: {
                id: true,
                projectRequestId: true,
                requirementName: true,
              }
            },
            Company: {
              select: {
                id: true,
                comercialName: true,
              }
            }
          }
        }
      }
    });

    if (!quotation) {
      return NextResponse.json(
        { error: "No se encontró la cotización" },
        { status: 404 }
      );
    }

    // Verificar que la cotización pertenezca al proyecto
    if (quotation.ProjectRequestCompany.ProjectRequirements.projectRequestId !== projectRequestId) {
      return NextResponse.json(
        { error: "La cotización no pertenece a este proyecto" },
        { status: 400 }
      );
    }

    // Verificar si la cotización ya está rechazada
    if (quotation.isClientApproved === false) {
      return NextResponse.json(
        { error: "La cotización ya ha sido rechazada" },
        { status: 400 }
      );
    }

    // Actualizar el estado de aprobación de la cotización
    await prisma.projectRequestRequirementQuotation.update({
      where: {
        projectRequestCompanyId: quotationId,
      },
      data: {
        isClientApproved: false,
        nonApprovalReason: rejectionReason,
      },
    });

    // Crear un log en la bitácora
    const requirementName = quotation.ProjectRequestCompany.ProjectRequirements.requirementName;
    const companyName = quotation.ProjectRequestCompany.Company.comercialName;
    
    const logMessage = `Cotización rechazada para el requerimiento "${requirementName}" del asociado "${companyName}". Motivo: ${rejectionReason}`;
    
    await ProjectRequestLogsService.createSystemLog(
      projectRequestId,
      "REQUIREMENT_QUOTATION_REJECTED",
      userId,
      true // Es un log a nivel de proyecto
    );

    return NextResponse.json({
      message: "Cotización rechazada correctamente",
      success: true,
    });
  } catch (error) {
    console.error("Error al rechazar cotización:", error);
    return NextResponse.json(
      { error: "Error al rechazar la cotización" },
      { status: 500 }
    );
  }
}
