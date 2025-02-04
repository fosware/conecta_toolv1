import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id } = await params;
    const companyId = parseInt(id);

    // Buscar la empresa
    const company = await prisma.company.findUnique({
      where: {
        id: companyId,
        isDeleted: false,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar el estado
    const updatedCompany = await prisma.company.update({
      where: {
        id: companyId,
      },
      data: {
        isActive: !company.isActive,
      },
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado de la empresa" },
      { status: 500 }
    );
  }
}
