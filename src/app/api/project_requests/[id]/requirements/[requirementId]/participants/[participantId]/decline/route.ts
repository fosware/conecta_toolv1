import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      requirementId: string;
      participantId: string;
    }>;
  }
) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el usuario es Admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.role.name.toLowerCase() !== "admin") {
      return NextResponse.json(
        { error: "Solo administradores pueden marcar declinaciones" },
        { status: 403 }
      );
    }

    // Extraer parámetros
    const { id, requirementId, participantId } = await params;
    const projectRequestId = parseInt(id);
    const parsedRequirementId = parseInt(requirementId);
    const parsedParticipantId = parseInt(participantId);

    // Validar IDs
    if (
      isNaN(projectRequestId) ||
      isNaN(parsedRequirementId) ||
      isNaN(parsedParticipantId)
    ) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    // Obtener hasDeclined del body
    const body = await request.json();
    const { hasDeclined } = body;

    if (typeof hasDeclined !== "boolean") {
      return NextResponse.json(
        { error: "hasDeclined debe ser un booleano" },
        { status: 400 }
      );
    }

    // Verificar que el participante existe y obtener datos necesarios
    const participant = await prisma.projectRequestCompany.findUnique({
      where: {
        id: parsedParticipantId,
        isActive: true,
        isDeleted: false,
      },
      include: {
        Company: {
          select: {
            id: true,
            comercialName: true,
          },
        },
        ProjectRequirements: {
          select: {
            id: true,
            requirementName: true,
            projectRequestId: true,
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participante no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el participante pertenece al proyecto y requerimiento correctos
    if (
      participant.ProjectRequirements.id !== parsedRequirementId ||
      participant.ProjectRequirements.projectRequestId !== projectRequestId
    ) {
      return NextResponse.json(
        {
          error:
            "El participante no pertenece al proyecto y requerimiento especificados",
        },
        { status: 400 }
      );
    }

    // Actualizar el campo hasDeclined
    const updatedParticipant = await prisma.projectRequestCompany.update({
      where: { id: parsedParticipantId },
      data: { hasDeclined },
    });

    // Crear log automático del sistema (siguiendo patrón de documents/upload)
    try {
      const logMessage = hasDeclined
        ? `[SISTEMA] El Asociado declinó cotizar`
        : `[SISTEMA] El Asociado fue re-habilitado para cotizar`;
      
      await prisma.projectRequestCompanyStatusLog.create({
        data: {
          projectRequestCompanyId: parsedParticipantId,
          message: logMessage,
          userId: userId,
          dateTimeMessage: new Date(),
        },
      });
    } catch (error) {
      console.error("Error al crear log automático:", error);
      // No fallar la operación principal si el log falla
    }

    return NextResponse.json(
      {
        id: updatedParticipant.id,
        hasDeclined: updatedParticipant.hasDeclined,
        companyName: participant.Company.comercialName,
        requirementName: participant.ProjectRequirements.requirementName,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al actualizar estado de declinación:", error);
    return NextResponse.json(
      { error: "Error al actualizar estado de declinación" },
      { status: 500 }
    );
  }
}
