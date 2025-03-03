import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Obtener el usuario desde el token
    const userId = await getUserFromToken().catch(error => {
      console.error("Error al obtener el usuario desde el token:", error);
      return null;
    });

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Asegurarse de que params se trate como una promesa
    const { id } = await params;
    const projectId = parseInt(id);
    
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Verificar que la solicitud existe
    const projectRequest = await prisma.projectRequest.findUnique({
      where: { id: projectId },
    });

    if (!projectRequest) {
      return NextResponse.json(
        { error: "La solicitud no existe" },
        { status: 404 }
      );
    }

    // Cambiar el estado
    const updatedProjectRequest = await prisma.projectRequest.update({
      where: { id: projectId },
      data: {
        isActive: !projectRequest.isActive,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `Solicitud ${updatedProjectRequest.isActive ? "activada" : "desactivada"} correctamente`,
      data: updatedProjectRequest,
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    return NextResponse.json(
      { error: "Error al cambiar el estado de la solicitud" },
      { status: 500 }
    );
  }
}
