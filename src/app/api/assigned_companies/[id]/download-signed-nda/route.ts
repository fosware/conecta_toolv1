import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
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

    // Obtener el ID de la empresa asignada siguiendo las mejores prácticas de Next.js 15
    const { id } = await params;
    const assignedCompanyId = parseInt(id);

    if (isNaN(assignedCompanyId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Buscar la empresa asignada y su NDA asociado
    const assignedCompany = await prisma.projectRequestCompany.findUnique({
      where: {
        id: assignedCompanyId,
        isDeleted: false,
      },
      include: {
        ClientCompanyNDA: true
      }
    });

    // Verificar que exista la empresa asignada y tenga un NDA firmado asociado
    if (!assignedCompany || !assignedCompany.ClientCompanyNDA?.ndaSignedFile) {
      return NextResponse.json(
        { error: "NDA firmado no encontrado" },
        { status: 404 }
      );
    }

    // Obtener el archivo del NDA firmado
    const ndaSignedFile = assignedCompany.ClientCompanyNDA.ndaSignedFile;
    const ndaSignedFileName = assignedCompany.ClientCompanyNDA.ndaSignedFileName;

    // Configurar la respuesta con el archivo
    const headers = new Headers();
    headers.set(
      "Content-Disposition",
      `attachment; filename="${ndaSignedFileName || 'nda_signed.pdf'}"`
    );
    headers.set("Content-Type", "application/pdf");

    return new NextResponse(ndaSignedFile, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error al descargar NDA firmado:", error);
    return NextResponse.json(
      { error: "Error al descargar NDA firmado" },
      { status: 500 }
    );
  }
}
