import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    // Extraer los IDs correctamente (Next.js 15)
    const { id, documentId } = await params;
    const projectRequestId = parseInt(id);
    const docId = parseInt(documentId);

    // Verificar que los IDs sean válidos
    if (isNaN(projectRequestId) || isNaN(docId)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Usar un ID de usuario fijo para pruebas (como se hace en otros endpoints)
    const userId = 1; // ID fijo para pruebas

    // Verificar que el documento existe y pertenece a la solicitud
    const document = await prisma.projectRequestDocuments.findFirst({
      where: {
        id: docId,
        projectRequestId,
        isDeleted: false,
        isActive: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      );
    }

    // Realizar un borrado lógico del documento
    await prisma.projectRequestDocuments.update({
      where: {
        id: docId,
      },
      data: {
        isDeleted: true,
        isActive: false,
        dateDeleted: new Date(),
        userId: userId, // Actualizar el usuario que realizó la eliminación
      },
    });

    // Obtener todos los asociados participantes que no estén eliminados ni rechazados
    // Los estados 12 (Cotización rechazada por el Cliente) y 8 (No seleccionado) son estados de rechazo
    const activeParticipants = await prisma.projectRequestCompany.findMany({
      where: {
        ProjectRequirements: {
          projectRequestId,
        },
        isDeleted: false,
        isActive: true,
        NOT: {
          statusId: {
            in: [8, 12], // Estados de rechazo
          },
        },
      },
    });

    // Crear un log para cada asociado participante
    for (const participant of activeParticipants) {
      await prisma.projectRequestCompanyStatusLog.create({
        data: {
          projectRequestCompanyId: participant.id,
          message: `[SISTEMA] Se ha eliminado el documento técnico "${document.documentFileName}".`,
          userId: userId,
          dateTimeMessage: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Documento eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar documento técnico:", error);
    return NextResponse.json(
      { error: "Error al eliminar documento técnico" },
      { status: 500 }
    );
  }
}
