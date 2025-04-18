import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { prisma } from "@/lib/prisma";
import { handleRouteParams } from "@/lib/route-params";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  let userId: number;
  try {
    userId = await getUserFromToken();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error de autorización" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const companyId = parseInt(id);

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { nda: true },
    });

    if (!company?.nda) {
      return NextResponse.json(
        { error: "No se encontró el archivo NDA" },
        { status: 404 }
      );
    }

    // Si el NDA está en Uint8Array, convertirlo directamente a Buffer
    const buffer = company.nda instanceof Uint8Array 
      ? Buffer.from(company.nda)
      : Buffer.from(company.nda, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al obtener el NDA" },
      { status: 500 }
    );
  }
}
