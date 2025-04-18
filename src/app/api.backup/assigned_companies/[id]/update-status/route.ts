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

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener los datos del cuerpo de la solicitud
    const data = await request.json();
    const { statusId } = data;

    if (!statusId) {
      return NextResponse.json(
        { error: "El ID de estado es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el ID de estado sea válido (8: Rechazada, 9: Aprobada)
    if (statusId !== 8 && statusId !== 9) {
      return NextResponse.json(
        { error: "El ID de estado no es válido" },
        { status: 400 }
      );
    }

    // Verificar que la empresa asignada exista
    const assignedCompany = await prisma.projectRequestCompany.findUnique({
      where: {
        id: parsedId,
        isDeleted: false,
      },
      include: {
        status: true,
      },
    });

    if (!assignedCompany) {
      return NextResponse.json(
        { error: "Empresa asignada no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar el estado de la empresa asignada
    const updatedAssignedCompany = await prisma.projectRequestCompany.update({
      where: {
        id: parsedId,
      },
      data: {
        statusId: statusId,
        updatedAt: new Date(),
      },
    });

    // Crear un log automático del sistema
    const messageType = statusId === 8 ? "QUOTATION_NOT_SELECTED" : "QUOTATION_APPROVED";
    await ProjectRequestLogsService.createSystemLog(
      parsedId,
      messageType as any,
      userId
    );

    return NextResponse.json({
      message: `Estado actualizado correctamente a ${statusId === 8 ? "No seleccionado" : "Revisión Ok"}`,
      data: updatedAssignedCompany,
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    return NextResponse.json(
      { error: "Error al actualizar estado" },
      { status: 500 }
    );
  }
}
