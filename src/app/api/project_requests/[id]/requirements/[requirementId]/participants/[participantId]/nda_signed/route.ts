import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; requirementId: string; participantId: string } }
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
    const { id, requirementId, participantId } = params;
    const projectRequestId = parseInt(id);
    const projectRequirementId = parseInt(requirementId);
    const participantIdNum = parseInt(participantId);
    
    if (isNaN(projectRequestId) || isNaN(projectRequirementId) || isNaN(participantIdNum)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Buscar el participante
    const participant = await prisma.projectRequestCompany.findFirst({
      where: {
        id: participantIdNum,
        projectRequirementsId: projectRequirementId,
        isDeleted: false,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participante no encontrado" },
        { status: 404 }
      );
    }

    // Procesar el archivo subido
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Convertir el archivo a un array de bytes
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    // Actualizar el registro con el archivo NDA firmado y cambiar el estado a "Firmado por Asociado"
    await prisma.projectRequestCompany.update({
      where: {
        id: participantIdNum,
      },
      data: {
        ndaSignedFile: fileBytes,
        ndaSignedFileName: file.name,
        ndaSignedAt: new Date(),
        statusId: 4, // "Firmado por Asociado"
        userId: userId,
      },
    });
    
    return NextResponse.json({
      message: "Archivo NDA firmado subido correctamente",
    });
  } catch (error) {
    console.error("Error al subir NDA firmado:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; requirementId: string; participantId: string } }
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
    const { id, requirementId, participantId } = params;
    const projectRequestId = parseInt(id);
    const projectRequirementId = parseInt(requirementId);
    const participantIdNum = parseInt(participantId);
    
    if (isNaN(projectRequestId) || isNaN(projectRequirementId) || isNaN(participantIdNum)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Buscar el participante
    const participant = await prisma.projectRequestCompany.findFirst({
      where: {
        id: participantIdNum,
        projectRequirementsId: projectRequirementId,
        isDeleted: false,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participante no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el participante tiene un NDA original
    const hasOriginalNDA = participant.ndaFile !== null;
    
    // Determinar el nuevo estado basado en si tiene NDA original
    const newStatusId = hasOriginalNDA ? 3 : 2; // 3: En espera de firma NDA, 2: Asociado seleccionado
    
    // Actualizar el registro para eliminar el archivo NDA firmado y actualizar el estado
    await prisma.projectRequestCompany.update({
      where: {
        id: participantIdNum,
      },
      data: {
        ndaSignedFile: null,
        ndaSignedFileName: null,
        ndaSignedAt: null,
        statusId: newStatusId,
        userId: userId,
      },
    });
    
    return NextResponse.json({
      message: "Archivo NDA firmado eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar NDA firmado:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
