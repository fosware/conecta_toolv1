import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// GET: Obtener certificados de un asociado
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id } = await params;
    const associateId = parseInt(id);

    if (isNaN(associateId)) {
      return new NextResponse(
        JSON.stringify({ error: "ID de asociado inválido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Primero verificar si el asociado existe
    const associate = await prisma.associate.findFirst({
      where: {
        id: associateId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!associate) {
      return new NextResponse(
        JSON.stringify({ error: "Asociado no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Obtener certificados sin incluir el archivo PDF
    const certificates = await prisma.associateCertifications.findMany({
      where: {
        associateId,
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        certificationId: true,
        certificationFileName: true,
        expiryDate: true,
        isActive: true,
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

    return NextResponse.json({ items: certificates }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener certificados:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al obtener los certificados" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST: Agregar un nuevo certificado a un asociado
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id } = await params;
    const associateId = parseInt(id);
    const formData = await request.formData();

    const certificationId = parseInt(formData.get("certificationId")?.toString() || "");
    const expiryDate = formData.get("expiryDate")?.toString() || "";
    const documentFile = formData.get("document") as File;

    if (!certificationId || !expiryDate || !documentFile) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Verificar si ya existe un certificado activo con la misma fecha
    const existingCertificate = await prisma.associateCertifications.findFirst({
      where: {
        associateId,
        certificationId,
        expiryDate: new Date(expiryDate),
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        certification: {
          select: {
            name: true
          }
        }
      }
    });

    if (existingCertificate) {
      return NextResponse.json(
        { 
          error: `Ya existe un certificado activo de ${existingCertificate.certification.name} con la misma fecha de expiración` 
        },
        { status: 400 }
      );
    }

    const documentBuffer = Buffer.from(await documentFile.arrayBuffer());

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
        certificationFileName: documentFile.name,
      },
      select: {
        id: true,
        certificationId: true,
        expiryDate: true,
        isActive: true,
        certificationFileName: true,
        certification: {
          select: {
            name: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Certificado creado correctamente", certificate: newCertificate },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear certificado:", error);
    
    // Manejar errores específicos de Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      switch (error.code) {
        case 'P2002':
          return NextResponse.json(
            { error: "Ya existe un certificado activo con la misma fecha de expiración" },
            { status: 400 }
          );
        default:
          return NextResponse.json(
            { error: "Error al crear el certificado" },
            { status: 500 }
          );
      }
    }

    return NextResponse.json(
      { error: "Error al crear el certificado" },
      { status: 500 }
    );
  }
}
