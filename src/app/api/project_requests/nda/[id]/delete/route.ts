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

    // Determinar si se está eliminando solo el NDA firmado o el NDA original
    const deleteOnlySignedNDA = request.nextUrl.searchParams.get("deleteOnlySignedNDA") === "true";
    const deleteOriginalNDA = !deleteOnlySignedNDA;

    // Actualizar el registro
    await prisma.projectRequestCompany.update({
      where: {
        id: parsedId,
      },
      data: {
        // Si se está eliminando el NDA original, eliminar tanto el original como el firmado
        // Si se está eliminando solo el NDA firmado, mantener el NDA original
        ...(deleteOriginalNDA ? {
          ndaFile: null,
          ndaFileName: null,
          // Cuando se elimina el NDA original, también eliminar el NDA firmado
          ndaSignedFile: null,
          ndaSignedFileName: null,
          ndaSignedAt: null,
        } : {
          // Cuando se elimina solo el NDA firmado, solo eliminar el NDA firmado
          ndaSignedFile: null,
          ndaSignedFileName: null,
          ndaSignedAt: null,
        }),
        // Cambiar el estatus a "Asociado seleccionado" (2) si se elimina el original
        // o a "En espera de firma NDA" (3) si solo se elimina el firmado
        statusId: deleteOriginalNDA ? 2 : 3,
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
