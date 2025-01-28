import { prisma } from "../../../../../lib/prisma";
import { getUserFromToken } from "../../../../../lib/get-user-from-token";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getUserFromToken();

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const associate = await prisma.associate.findUnique({
      where: { id },
      select: { nda: true },
    });

    if (!associate) {
      return NextResponse.json(
        { error: "Asociado no encontrado" },
        { status: 404 }
      );
    }

    if (!associate.nda) {
      return NextResponse.json(
        { error: "El asociado no tiene NDA" },
        { status: 404 }
      );
    }

    // Devolver el PDF con los headers correctos
    return new NextResponse(associate.nda, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="nda_${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error in GET /asociados/[id]/nda:", error);
    return NextResponse.json(
      { error: "Error al obtener el NDA" },
      { status: 500 }
    );
  }
}
