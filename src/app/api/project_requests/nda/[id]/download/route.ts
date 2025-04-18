import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

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

    // Obtener el ID del participante
    const { id } = await params;
    const participantId = parseInt(id);

    if (isNaN(participantId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Buscar el participante
    const projectRequestCompany = await prisma.projectRequestCompany.findUnique({
      where: {
        id: participantId,
      },
      include: {
        Company: true
      }
    });

    if (!projectRequestCompany) {
      return NextResponse.json(
        { error: "Participante no encontrado" },
        { status: 404 }
      );
    }

    // Buscar el NDA asociado a la compañía
    const clientCompanyNDA = await prisma.clientCompanyNDA.findFirst({
      where: {
        companyId: projectRequestCompany.companyId,
        isActive: true,
        isDeleted: false
      }
    });

    // Verificar que exista el NDA
    if (!clientCompanyNDA) {
      return NextResponse.json(
        { error: "NDA no encontrado" },
        { status: 404 }
      );
    }

    // Obtener el archivo del NDA
    const ndaFile = clientCompanyNDA.ndaSignedFile;
    const ndaFileName = clientCompanyNDA.ndaSignedFileName;

    // Configurar la respuesta con el archivo
    const headers = new Headers();
    headers.set(
      "Content-Disposition",
      `attachment; filename="${ndaFileName || 'nda.pdf'}"`
    );
    headers.set("Content-Type", "application/pdf");

    return new NextResponse(ndaFile, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error al descargar NDA:", error);
    return NextResponse.json(
      { error: "Error al descargar NDA" },
      { status: 500 }
    );
  }
}
