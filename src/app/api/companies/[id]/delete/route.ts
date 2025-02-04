import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id } = await params;
    const companyId = parseInt(id);

    // Verificar que la empresa exista
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    // Marcar como eliminada
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        isDeleted: true,
        userId,
        dateDeleted: new Date(),
      },
    });

    return NextResponse.json({
      message: "Empresa eliminada correctamente",
      data: updatedCompany,
    });
  } catch (error) {
    console.error("Error in DELETE /api/companies/[id]/delete:", error);
    return NextResponse.json(
      { error: "Error al eliminar la empresa" },
      { status: 500 }
    );
  }
}
