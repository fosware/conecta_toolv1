import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    const { searchParams } = new URL(request.url);
    const associateId = parseInt(searchParams.get("associateId") || "");

    if (isNaN(associateId)) {
      return new NextResponse(
        JSON.stringify({ error: "ID de asociado inválido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const certificates = await prisma.associateCertifications.findMany({
      where: {
        associateId,
        isActive: true,
        isDeleted: false,
      },
      include: {
        certification: {
          select: {
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return new NextResponse(
      JSON.stringify({ items: certificates }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error al obtener certificados:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al obtener los certificados" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    const formData = await request.formData();

    // Obtener y validar los campos básicos
    const associateId = parseInt(formData.get("associateId")?.toString() || "");
    const certificationId = parseInt(formData.get("certificationId")?.toString() || "");
    const expiryDate = formData.get("expiryDate")?.toString();
    const documentFile = formData.get("document");

    // Validaciones
    if (!associateId || isNaN(associateId)) {
      return new NextResponse(
        JSON.stringify({ error: "ID de asociado inválido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!certificationId || isNaN(certificationId)) {
      return new NextResponse(
        JSON.stringify({ error: "ID de certificado inválido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!expiryDate) {
      return new NextResponse(
        JSON.stringify({ error: "La fecha de vencimiento es requerida" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Manejar el archivo del certificado
    let documentBuffer: Buffer | null = null;
    if (documentFile && documentFile instanceof File) {
      const bytes = await documentFile.arrayBuffer();
      documentBuffer = Buffer.from(bytes);
    } else {
      return new NextResponse(
        JSON.stringify({ error: "El documento PDF es requerido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verificar si ya existe un certificado activo para este asociado
    const existingCertificate = await prisma.associateCertifications.findFirst({
      where: {
        associateId,
        certificationId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (existingCertificate) {
      return new NextResponse(
        JSON.stringify({ error: "El asociado ya tiene este certificado activo" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Crear el certificado
    const newCertificate = await prisma.associateCertifications.create({
      data: {
        associateId,
        certificationId,
        userId,
        expiryDate: new Date(expiryDate),
        isActive: true,
        isDeleted: false,
        certificationFile: documentBuffer,
      },
      select: {
        id: true,
        certificationId: true,
        expiryDate: true,
        isActive: true,
        certification: {
          select: {
            name: true,
            description: true,
          },
        },
      },
    });

    return new NextResponse(
      JSON.stringify({ item: newCertificate }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error al crear certificado:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al crear el certificado" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
