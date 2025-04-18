import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    const { searchParams } = new URL(request.url);
    const companyId = parseInt(searchParams.get("associateId") || "");

    if (isNaN(companyId)) {
      return new NextResponse(
        JSON.stringify({ error: "ID de empresa inválido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const certificates = await prisma.companyCertifications.findMany({
      where: {
        companyId,
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
    const companyId = parseInt(formData.get("associateId")?.toString() || "");
    const certificationId = parseInt(formData.get("certificationId")?.toString() || "");
    const expiryDate = formData.get("expiryDate")?.toString();
    const documentFile = formData.get("document");

    // Validaciones
    if (!companyId || isNaN(companyId)) {
      return new NextResponse(
        JSON.stringify({ error: "ID de empresa inválido" }),
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
    let fileBuffer: Buffer | null = null;
    let fileName: string | null = null;
    if (documentFile && documentFile instanceof File) {
      const bytes = await documentFile.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      fileName = documentFile.name;
    } else {
      return new NextResponse(
        JSON.stringify({ error: "El documento PDF es requerido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verificar si ya existe un certificado activo para esta empresa
    const existingCertificate = await prisma.companyCertifications.findFirst({
      where: {
        companyId,
        certificationId,
        isDeleted: false,
      },
    });

    if (existingCertificate) {
      return new NextResponse(
        JSON.stringify({ error: "La empresa ya tiene este certificado activo" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Crear el certificado
    const newCertificate = await prisma.companyCertifications.create({
      data: {
        companyId,
        certificationId,
        userId,
        expirationDate: new Date(expiryDate),
        certificateFile: fileBuffer,
        certificateFileName: fileName,
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        companyId: true,
        certificationId: true,
        expirationDate: true,
        isActive: true,
        createdAt: true,
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
