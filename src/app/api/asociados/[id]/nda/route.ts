import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromToken } from "../../../../../lib/get-user-from-token";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getUserFromToken();
    const id = parseInt(params.id);

    const associate = await prisma.associate.findUnique({
      where: { id },
      select: { nda: true, ndaFileName: true },
    });

    if (!associate || !associate.nda || !associate.ndaFileName) {
      return new NextResponse("NDA not found", { status: 404 });
    }

    // Convertir Uint8Array a Buffer
    const buffer = Buffer.from(associate.nda);

    // Crear headers para la descarga
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `inline; filename="${associate.ndaFileName}"`
    );

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error downloading NDA:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
