import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const certId = parseInt(id);
    const userId = await getUserFromToken();

    // Verificar que el certificado existe
    const certificate = await prisma.companyCertifications.findFirst({
      where: {
        id: certId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificado no encontrado" },
        { status: 404 }
      );
    }

    // Marcar como eliminado
    await prisma.companyCertifications.update({
      where: {
        id: certId,
      },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
        isActive: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al eliminar el certificado" },
      { status: 500 }
    );
  }
}
