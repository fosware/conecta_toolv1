import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; certificateId: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id, certificateId } = await params;
    const companyId = parseInt(id);
    const certId = parseInt(certificateId);

    if (isNaN(companyId) || isNaN(certId)) {
      return new NextResponse(
        JSON.stringify({ error: "ID inválido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Obtener el certificado
    const certificate = await prisma.companyCertifications.findFirst({
      where: {
        companyId,
        id: certId,
      },
      select: {
        id: true,
        certificateFile: true,
        certification: {
          select: {
            name: true
          }
        }
      }
    });

    if (!certificate || !certificate.certificateFile) {
      return new NextResponse(
        JSON.stringify({ error: "Certificado no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generar un nombre de archivo basado en el nombre de la certificación
    const fileName = `${certificate.certification.name.replace(/\s+/g, '_')}_${certificate.id}.pdf`;

    return new NextResponse(certificate.certificateFile, {
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
