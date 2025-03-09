import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; companyId: string } }
) {
  try {
    // Extraer los IDs correctamente según las prácticas de Next.js 15
    const { id, companyId } = await params;
    const projectRequestId = parseInt(id);
    const parsedCompanyId = parseInt(companyId);
    
    // Verificar que los IDs sean válidos
    if (isNaN(projectRequestId) || isNaN(parsedCompanyId)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Buscar el registro del participante
    const participant = await prisma.projectRequestCompany.findFirst({
      where: {
        projectRequestId: projectRequestId,
        companyId: parsedCompanyId,
        isDeleted: false,
      },
      select: {
        id: true,
        ndaFile: true,
        ndaFileName: true,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participante no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ participant });
  } catch (error) {
    console.error("Error al obtener información del participante:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
