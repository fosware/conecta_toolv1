import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Obtener el ID de la URL siguiendo las mejores prácticas de Next.js 15
    const { id } = await params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Verificar que la empresa existe
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

    // Realizar eliminación lógica
    await prisma.company.update({
      where: {
        id: companyId,
      },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
        isActive: false,
        userId: userId,
      },
    });

    return NextResponse.json(
      { message: "Empresa eliminada correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar empresa:", error);
    return NextResponse.json(
      { error: "Error al eliminar la empresa" },
      { status: 500 }
    );
  }
}
