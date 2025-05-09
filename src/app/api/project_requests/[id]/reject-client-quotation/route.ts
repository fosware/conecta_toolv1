import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { ProjectRequestLogsService } from "@/lib/services/project-request-logs";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente según las mejores prácticas de Next.js 15
    const { id } = await params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el motivo de rechazo del cuerpo de la solicitud
    const body = await request.json();
    const { rejectionReason } = body;

    if (!rejectionReason || rejectionReason.trim() === "") {
      return NextResponse.json(
        { error: "El motivo de rechazo es obligatorio" },
        { status: 400 }
      );
    }

    // Obtener la solicitud de proyecto
    const projectRequest = await prisma.projectRequest.findUnique({
      where: { id: parsedId },
    });

    if (!projectRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    // Encontrar todos los requerimientos para este proyecto
    const requirements = await prisma.projectRequirements.findMany({
      where: {
        projectRequestId: parsedId,
        isActive: true,
        isDeleted: false,
      },
    });

    const requirementIds = requirements.map(req => req.id);

    // Actualizar el estado de TODOS los asociados seleccionados a "Cotización rechazada por el Cliente" (ID 12)
    // Esto incluye los que están en "En espera de aprobación" (ID 16) y los que ya fueron aprobados (ID 14)
    // IMPORTANTE: La tabla ProjectRequestCompany es la misma que se usa en la vista de assigned_companies
    // por lo que al actualizar aquí, se actualiza en ambas vistas
    const updatedCompanies = await prisma.projectRequestCompany.updateMany({
      where: {
        projectRequirementsId: {
          in: requirementIds,
        },
        // Actualizar solo los asociados que fueron seleccionados (están en espera de aprobación o ya aprobados)
        statusId: {
          in: [14, 16] // Cotización aprobada por el Cliente (14) o En espera de aprobación (16)
        },
        isActive: true,
        isDeleted: false,
      },
      data: {
        statusId: 12, // Cotización rechazada por el Cliente
      },
    });
    
    // Forzar una actualización en la tabla ProjectRequestCompany para asegurar que los cambios
    // se reflejen en todas las vistas (project_requests y assigned_companies)
    // Esto es necesario porque a veces hay problemas de caché o de sincronización
    const updatedProjectRequestCompanies = await prisma.projectRequestCompany.findMany({
      where: {
        projectRequirementsId: {
          in: requirementIds,
        },
        statusId: 12, // Cotización rechazada por el Cliente
        isActive: true,
        isDeleted: false,
      },
    });
    
    // Actualizar cada registro individualmente para forzar la actualización
    for (const company of updatedProjectRequestCompanies) {
      // Actualizar solo el timestamp para forzar la actualización
      // El motivo de rechazo se guarda en los logs
      await prisma.projectRequestCompany.update({
        where: {
          id: company.id
        },
        data: {
          updatedAt: new Date() // Forzar actualización de timestamp
        }
      });
    }

    // Obtener las compañías actualizadas para crear logs
    const companiesRejected = await prisma.projectRequestCompany.findMany({
      where: {
        projectRequirementsId: {
          in: requirementIds,
        },
        statusId: 12, // Recién actualizado a Cotización rechazada por el Cliente
        isActive: true,
        isDeleted: false,
      },
      include: {
        Company: true,
        ProjectRequirements: true,
      },
    });

    // Crear logs para cada asociado actualizado
    for (const company of companiesRejected) {
      await ProjectRequestLogsService.createLog({
        projectRequestCompanyId: company.id,
        message: `Cotización rechazada por el cliente. Motivo: ${rejectionReason}`,
        userId: userId,
        isSystemMessage: true,
      });
    }

    // Actualizar el estado de la solicitud principal a "Rechazada" (ID 21)
    await prisma.projectRequest.update({
      where: { id: parsedId },
      data: { statusId: 21 }, // Estado "Rechazada"
    });

    return NextResponse.json({
      message: "Cotizaciones rechazadas correctamente",
      updatedCount: updatedCompanies.count,
    });
  } catch (error) {
    console.error("Error al rechazar cotizaciones:", error);
    return NextResponse.json(
      { error: "Error al rechazar cotizaciones" },
      { status: 500 }
    );
  }
}
