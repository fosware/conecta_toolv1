import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; certificateId: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id, certificateId } = params;
    const associateId = parseInt(id);
    const certId = parseInt(certificateId);

    if (isNaN(associateId) || isNaN(certId)) {
      return new NextResponse(
        JSON.stringify({ error: "ID inválido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const certificate = await prisma.associateCertifications.findFirst({
      where: {
        id: certId,
        associateId,
        isActive: true,
        isDeleted: false,
      },
      include: {
        certification: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!certificate || !certificate.certificationFile) {
      return new NextResponse(
        JSON.stringify({ error: "Certificado no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generar un nombre de archivo basado en el nombre de la certificación
    const fileName = `${certificate.certification.name.replace(/\s+/g, '_')}_${certificate.id}.pdf`;

    return new NextResponse(certificate.certificationFile, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error al descargar certificado:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al descargar el certificado" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
