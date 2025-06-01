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

    // Actualizar el estado de los asociados seleccionados a "Cotización aprobada por el cliente" (ID 14)
    // Esto incluye los que están en "En espera de aprobación" (ID 16) y los que tienen "Cotización rechazada por el Cliente"
    // IMPORTANTE: La tabla ProjectRequestCompany es la misma que se usa en la vista de assigned_companies
    // por lo que al actualizar aquí, se actualiza en ambas vistas
    
    // Buscar el ID del estado "Cotización rechazada por el Cliente"
    const rejectedStatus = await prisma.statusProjectRequest.findFirst({
      where: {
        name: "Cotización rechazada por el Cliente",
      },
    });
    
    const rejectedStatusId = rejectedStatus ? rejectedStatus.id : 0;
    
    // Actualizar los asociados que están en espera de aprobación O con cotización rechazada
    const updatedCompanies = await prisma.projectRequestCompany.updateMany({
      where: {
        projectRequirementsId: {
          in: requirementIds,
        },
        // Actualizar los asociados que están en espera de aprobación O con cotización rechazada
        statusId: { in: [16, rejectedStatusId] }, // 16 = En espera de aprobación
        isActive: true,
        isDeleted: false,
      },
      data: {
        statusId: 14, // Cotización aprobada por el cliente
      },
    });
    
    // Contador de actualizaciones
    const updatedCount = updatedCompanies.count;
    
    // Forzar una actualización en la tabla ProjectRequestCompany para asegurar que los cambios
    // se reflejen en todas las vistas (project_requests y assigned_companies)
    // Esto es necesario porque a veces hay problemas de caché o de sincronización
    const updatedProjectRequestCompanies = await prisma.projectRequestCompany.findMany({
      where: {
        projectRequirementsId: {
          in: requirementIds,
        },
        statusId: 14, // Cotización aprobada por el cliente
        isActive: true,
        isDeleted: false,
      },
    });
    
    // Actualizar cada registro individualmente para forzar la actualización
    for (const company of updatedProjectRequestCompanies) {
      await prisma.projectRequestCompany.update({
        where: {
          id: company.id
        },
        data: {
          updatedAt: new Date(), // Forzar actualización de timestamp
        }
      });
    }

    // Obtener las compañías actualizadas para crear logs
    const companiesApproved = await prisma.projectRequestCompany.findMany({
      where: {
        projectRequirementsId: {
          in: requirementIds,
        },
        statusId: 14, // Recién actualizado a Cotización aprobada por el cliente
        isActive: true,
        isDeleted: false,
      },
      include: {
        Company: true,
        ProjectRequirements: true,
      },
    });

    // Crear logs para cada asociado actualizado
    for (const company of companiesApproved) {
      await ProjectRequestLogsService.createLog({
        projectRequestCompanyId: company.id,
        message: "Cotización aprobada por el cliente.",
        userId: userId,
        isSystemMessage: true,
      });
    }

    // Actualizar el estado de la solicitud principal a "Cotización aprobada por el Cliente" (ID 14)
    await prisma.projectRequest.update({
      where: { id: parsedId },
      data: { statusId: 14 }, // Estado "Cotización aprobada por el Cliente"
    });

    return NextResponse.json({
      message: "Cotizaciones aprobadas correctamente",
      updatedCount: updatedCount,
    });
  } catch (error) {
    console.error("Error al aprobar cotizaciones:", error);
    return NextResponse.json(
      { error: "Error al aprobar cotizaciones" },
      { status: 500 }
    );
  }
}
