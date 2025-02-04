import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; certificateId: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id, certificateId } = await params;
    const companyId = parseInt(id);
    const certId = parseInt(certificateId);

    if (isNaN(companyId) || isNaN(certId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Verificar si el certificado existe
    const certificate = await prisma.companyCertifications.findFirst({
      where: {
        id: certId,
        companyId,
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

    // Eliminar el certificado
    await prisma.companyCertifications.update({
      where: {
        id: certId,
      },
      data: {
        isDeleted: true,
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
