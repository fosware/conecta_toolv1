import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente según las mejores prácticas de Next.js 15
    const { id } = await params;
    const parsedId = parseInt(id);

    // Verificar autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token || !token.value) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener los datos del cuerpo de la solicitud
    const data = await request.json();
    const { statusId } = data;

    if (!statusId) {
      return NextResponse.json(
        { error: "El ID de estado es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el ID de estado sea válido (8: Rechazada, 9: Aprobada)
    if (statusId !== 8 && statusId !== 9) {
      return NextResponse.json(
        { error: "El ID de estado no es válido" },
        { status: 400 }
      );
    }

    // Verificar que la empresa asignada exista
    const assignedCompany = await prisma.projectRequestCompany.findUnique({
      where: {
        id: parsedId,
        isDeleted: false,
      },
    });

    if (!assignedCompany) {
      return NextResponse.json(
        { error: "Empresa asignada no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar el estado de la empresa asignada
    const updatedAssignedCompany = await prisma.projectRequestCompany.update({
      where: {
        id: parsedId,
      },
      data: {
        statusId: statusId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `Estado actualizado correctamente a ${statusId === 8 ? "Cotización rechazada" : "Revisión Ok"}`,
      data: updatedAssignedCompany,
    });
  } catch (error) {
    console.error("Error al actualizar el estado:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado" },
      { status: 500 }
    );
  }
}
