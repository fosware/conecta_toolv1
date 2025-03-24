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
    
    console.log("Buscando relación para projectRequestId:", projectRequestId, "companyId:", parsedCompanyId);
    
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

    console.log("Participante encontrado:", participant);

    if (!participant) {
      return NextResponse.json(
        { error: "Participante no encontrado" },
        { status: 404 }
      );
    }

    // Devolver directamente el objeto con el id
    return NextResponse.json({
      id: participant.id,
      ndaFile: participant.ndaFile,
      ndaFileName: participant.ndaFileName
    });
  } catch (error) {
    console.error("Error al obtener información del participante:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
