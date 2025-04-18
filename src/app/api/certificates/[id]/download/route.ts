import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const userId = await getUserFromToken();

    const certificate = await prisma.companyCertifications.findFirst({
      where: {
        id: parseInt(id),
        isActive: true,
        isDeleted: false,
      },
      select: {
        certificateFile: true,
        certificateFileName: true,
      },
    });

    if (!certificate || !certificate.certificateFile) {
      return NextResponse.json(
        { error: "Certificado no encontrado" },
        { status: 404 }
      );
    }

    // Crear headers para la descarga
    const headers = new Headers();
    headers.set(
      "Content-Disposition",
      `attachment; filename="${certificate.certificateFileName}"`
    );
    headers.set("Content-Type", "application/octet-stream");

    return new NextResponse(certificate.certificateFile, {
      headers,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al descargar el certificado" },
      { status: 500 }
    );
  }
}
