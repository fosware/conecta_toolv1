import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromToken } from "@/lib/get-user-from-token";

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente
    const { id } = await params;
    const parsedId = parseInt(id);

    // Verificar usuario
    const userId = await getUserFromToken();

    // Buscar el registro de la empresa participante
    const projectRequestCompany = await prisma.projectRequestCompany.findFirst({
      where: {
        id: parsedId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!projectRequestCompany) {
      return NextResponse.json(
        { error: "Registro de participante no encontrado" },
        { status: 404 }
      );
    }

    // Determinar si hay que eliminar solo el NDA original o también el firmado
    const deleteSignedNDA = request.nextUrl.searchParams.get("deleteSignedNDA") === "true";

    // Actualizar el registro
    await prisma.projectRequestCompany.update({
      where: {
        id: parsedId,
      },
      data: {
        ndaFile: null,
        ndaFileName: null,
        // Si se solicita eliminar el NDA firmado, también lo eliminamos
        ...(deleteSignedNDA
          ? {
              ndaSignedFile: null,
              ndaSignedFileName: null,
              ndaSignedAt: null,
            }
          : {}),
        // Cambiar el estatus a "Asociado seleccionado" (2)
        statusId: 2,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar NDA:", error);
    return NextResponse.json(
      { error: "Error al eliminar el archivo NDA" },
      { status: 500 }
    );
  }
}
