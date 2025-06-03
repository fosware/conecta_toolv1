import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente (Next.js 15)
    const { id } = await params;
    const projectRequestId = parseInt(id);

    // Verificar que el ID sea válido
    if (isNaN(projectRequestId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Verificar que la solicitud existe
    const projectRequest = await prisma.projectRequest.findUnique({
      where: {
        id: projectRequestId,
        isDeleted: false,
        isActive: true,
      },
    });

    if (!projectRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    // Usar un ID de usuario fijo para pruebas (como se hace en otros endpoints)
    const userId = 1; // ID fijo para pruebas

    // Procesar el archivo
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se ha proporcionado ningún archivo" },
        { status: 400 }
      );
    }

    // Se ha eliminado la restricción de tamaño de archivo
    // Los usuarios pueden subir archivos de cualquier tamaño

    // Leer el archivo como un ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    // Guardar el documento en la base de datos
    const document = await prisma.projectRequestDocuments.create({
      data: {
        projectRequestId,
        documentFileName: file.name,
        documentFile: buffer,
        userId,
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
      include: {
        Company: true,
      },
    });

    // Crear un log para cada asociado participante
    for (const participant of activeParticipants) {
      await prisma.projectRequestCompanyStatusLog.create({
        data: {
          projectRequestCompanyId: participant.id,
          message: `[SISTEMA] Se ha subido un nuevo documento técnico "${file.name}".`,
          userId: userId,
          dateTimeMessage: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        documentFileName: document.documentFileName,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    console.error("Error al subir documento técnico:", error);
    return NextResponse.json(
      { error: "Error al subir documento técnico" },
      { status: 500 }
    );
  }
}
