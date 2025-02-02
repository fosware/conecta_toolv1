import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; certificateId: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id, certificateId } = params;
    const associateId = parseInt(id);
    const certId = parseInt(certificateId);

    if (isNaN(associateId) || isNaN(certId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Verificar que el certificado existe y pertenece al asociado
    const certificate = await prisma.associateCertifications.findFirst({
      where: {
        id: certId,
        associateId,
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificado no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si ya está eliminado
    if (certificate.isDeleted) {
      return NextResponse.json(
        { error: "Este certificado ya fue eliminado" },
        { status: 400 }
      );
    }

    // Realizar eliminado lógico
    await prisma.associateCertifications.update({
      where: {
        id: certId,
      },
      data: {
        isActive: false,
        isDeleted: true,
        dateDeleted: new Date(),
        userId,
      },
    });

    return NextResponse.json(
      { message: "Certificado eliminado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar certificado:", error);
    
    return NextResponse.json(
      { error: "Error al eliminar el certificado" },
      { status: 500 }
    );
  }
}
