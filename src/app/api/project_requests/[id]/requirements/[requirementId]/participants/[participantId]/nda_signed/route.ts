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
    const { id, requirementId, participantId } = await params;
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
    const participant = await prisma.projectRequestCompany.findUnique({
      where: {
        id: participantIdNum,
        projectRequirementsId: projectRequirementId,
        isDeleted: false,
      },
      include: {
        ClientCompanyNDA: true
      }
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participante no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si ya existe un NDA asociado
    if (!participant.clientCompanyNDAId) {
      return NextResponse.json(
        { error: "No hay un NDA asociado a este participante" },
        { status: 400 }
      );
    }

    // Obtener el archivo del formulario
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Leer el archivo como un ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Actualizar el NDA con el archivo firmado
    const updatedNDA = await prisma.clientCompanyNDA.update({
      where: {
        id: participant.clientCompanyNDAId
      },
      data: {
        ndaSignedFile: buffer,
        ndaSignedFileName: file.name,
        ndaExpirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año desde ahora
      }
    });

    // Actualizar el registro con el archivo NDA firmado y cambiar el estado a "Firmado por Asociado"
    await prisma.projectRequestCompany.update({
      where: {
        id: participantIdNum,
      },
      data: {
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
    const { id, requirementId, participantId } = await params;
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
    const participant = await prisma.projectRequestCompany.findUnique({
      where: {
        id: participantIdNum,
        projectRequirementsId: projectRequirementId,
        isDeleted: false,
      },
      include: {
        ClientCompanyNDA: true
      }
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participante no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si ya existe un NDA asociado
    if (!participant.clientCompanyNDAId) {
      return NextResponse.json(
        { error: "No hay un NDA asociado a este participante" },
        { status: 400 }
      );
    }

    // Eliminar el archivo NDA firmado del NDA
    await prisma.clientCompanyNDA.update({
      where: {
        id: participant.clientCompanyNDAId
      },
      data: {
        ndaSignedFile: Buffer.from([]), // Buffer vacío en lugar de null
        ndaSignedFileName: "", // String vacío en lugar de null
        ndaExpirationDate: new Date(0), // Fecha mínima en lugar de null
      }
    });

    // Verificar si el participante tiene un NDA original
    const hasOriginalNDA = !!participant.ClientCompanyNDA?.ndaSignedFile;
    
    // Determinar el nuevo estado basado en si tiene NDA original
    const newStatusId = hasOriginalNDA ? 3 : 2; // 3: En espera de firma NDA, 2: Asociado seleccionado
    
    // Actualizar el registro para eliminar el archivo NDA firmado y actualizar el estado
    await prisma.projectRequestCompany.update({
      where: {
        id: participantIdNum,
      },
      data: {
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
