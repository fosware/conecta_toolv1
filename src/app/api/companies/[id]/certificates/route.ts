import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// GET: Obtener certificados de una empresa
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const companyId = parseInt(id);
    const userId = await getUserFromToken();

    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "ID de empresa inválido" },
        { status: 400 }
      );
    }

    // Primero verificar si la empresa existe
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    const items = await prisma.companyCertifications.findMany({
      where: {
        companyId,
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        certification: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        certificateFileName: true,
        expirationDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al obtener certificados" },
      { status: 500 }
    );
  }
}

// POST: Agregar un nuevo certificado
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const companyId = parseInt(id);
    const userId = await getUserFromToken();

    const formData = await request.formData();
    const certificationId = parseInt(formData.get("certificationId") as string);
    const expirationDate = new Date(formData.get("expirationDate") as string);
    const certificateFile = formData.get("certificateFile") as File;

    if (!certificationId || isNaN(certificationId)) {
      return NextResponse.json(
        { error: "La certificación es requerida" },
        { status: 400 }
      );
    }

    if (!expirationDate || isNaN(expirationDate.getTime())) {
      return NextResponse.json(
        { error: "La fecha de vencimiento es requerida" },
        { status: 400 }
      );
    }

    if (!certificateFile) {
      return NextResponse.json(
        { error: "El archivo del certificado es requerido" },
        { status: 400 }
      );
    }

    // Validar que no exista un certificado activo con la misma fecha de vencimiento
    const existingCertificate = await prisma.companyCertifications.findFirst({
      where: {
        companyId,
        certificationId,
        expirationDate,
        isActive: true,
        isDeleted: false,
      },
    });

    if (existingCertificate) {
      return NextResponse.json(
        { error: "Ya existe un certificado activo para esta certificación con la misma fecha de vencimiento" },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await certificateFile.arrayBuffer());
    const certificate = await prisma.companyCertifications.create({
      data: {
        companyId,
        certificationId,
        expirationDate,
        certificateFile: fileBuffer,
        certificateFileName: certificateFile.name,
        userId,
      },
    });

    return NextResponse.json(certificate);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear el certificado" },
      { status: 500 }
    );
  }
}
