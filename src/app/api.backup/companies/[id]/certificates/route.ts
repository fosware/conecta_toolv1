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
    
    // Obtener parámetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const showExpired = searchParams.get('showExpired') === 'true';

    if (isNaN(companyId)) {
      return NextResponse.json(
        { 
          success: false,
          error: "ID de empresa inválido" 
        },
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
        { 
          success: false,
          error: "Empresa no encontrada" 
        },
        { status: 404 }
      );
    }

    // Construir la consulta base
    const whereClause: any = {
      companyId,
      isActive: true,
      isDeleted: false,
    };

    const items = await prisma.companyCertifications.findMany({
      where: whereClause,
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
        isCommitment: true,
        commitmentDate: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Error al obtener certificados" 
      },
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
    const isCommitment = formData.get("isCommitment") === "true";
    const expirationDate = formData.get("expirationDate") as string;
    const commitmentDate = formData.get("commitmentDate") as string;
    const certificateFile = formData.get("certificateFile");

    if (!certificationId || isNaN(certificationId)) {
      return NextResponse.json(
        { 
          success: false,
          error: "La certificación es requerida" 
        },
        { status: 400 }
      );
    }

    // Validaciones según si es compromiso o no
    if (isCommitment) {
      if (!commitmentDate) {
        return NextResponse.json(
          { 
            success: false,
            error: "La fecha de compromiso es requerida" 
          },
          { status: 400 }
        );
      }
    } else {
      if (!expirationDate) {
        return NextResponse.json(
          { 
            success: false,
            error: "La fecha de vencimiento es requerida" 
          },
          { status: 400 }
        );
      }

      if (!certificateFile) {
        return NextResponse.json(
          { 
            success: false,
            error: "El archivo del certificado es requerido" 
          },
          { status: 400 }
        );
      }
    }

    // Validar si ya existe un certificado activo para esta certificación
    const existingCertificate = await prisma.companyCertifications.findFirst({
      where: {
        companyId,
        certificationId,
        isActive: true,
        isDeleted: false, // Solo considerar certificados no eliminados
      }
    });

    if (existingCertificate) {
      return NextResponse.json(
        { 
          success: false,
          error: "Esta certificación ya existe para esta empresa." 
        },
        { status: 400 }
      );
    }

    // Convertir fechas
    let parsedExpirationDate = null;
    let parsedCommitmentDate = null;

    if (expirationDate) {
      parsedExpirationDate = new Date(expirationDate);
      if (isNaN(parsedExpirationDate.getTime())) {
        return NextResponse.json(
          { 
            success: false,
            error: "Fecha de vencimiento inválida" 
          },
          { status: 400 }
        );
      }
    }

    if (commitmentDate) {
      parsedCommitmentDate = new Date(commitmentDate);
      if (isNaN(parsedCommitmentDate.getTime())) {
        return NextResponse.json(
          { 
            success: false,
            error: "Fecha de compromiso inválida" 
          },
          { status: 400 }
        );
      }
    }

    // Procesar el archivo si existe
    let certificateBuffer = null;
    let fileName = null;
    if (certificateFile && 
        typeof certificateFile === "object" && 
        "arrayBuffer" in certificateFile && 
        typeof certificateFile.arrayBuffer === "function") {
      const bytes = await certificateFile.arrayBuffer();
      certificateBuffer = Buffer.from(bytes);
      fileName = "name" in certificateFile ? certificateFile.name : null;
    }

    // Crear el certificado
    const certificate = await prisma.companyCertifications.create({
      data: {
        companyId,
        certificationId,
        isCommitment,
        expirationDate: parsedExpirationDate,
        commitmentDate: parsedCommitmentDate,
        certificateFile: certificateBuffer,
        certificateFileName: fileName,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: certificate,
      message: isCommitment 
        ? "Compromiso agregado correctamente" 
        : "Certificado agregado correctamente"
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Error al crear el certificado" 
      },
      { status: 500 }
    );
  }
}
