import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// PUT: Actualizar un certificado
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; certificateId: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id, certificateId } = await params;
    const companyId = parseInt(id);
    const certId = parseInt(certificateId);

    if (isNaN(companyId) || isNaN(certId)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID inválido",
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const certificationId = parseInt(formData.get("certificationId") as string);
    const isCommitment = formData.get("isCommitment") === "true";
    const expirationDate = formData.get("expirationDate") as string;
    const commitmentDate = formData.get("commitmentDate") as string;
    const certificateFile = formData.get("certificateFile") as File;

    if (!certificationId || isNaN(certificationId)) {
      return NextResponse.json(
        {
          success: false,
          error: "La certificación es requerida",
        },
        { status: 400 }
      );
    }

    // Verificar si existe el certificado
    const existingCertificate = await prisma.companyCertifications.findFirst({
      where: {
        id: certId,
        companyId,
      },
    });

    if (!existingCertificate) {
      return NextResponse.json(
        {
          success: false,
          error: "Certificado no encontrado",
        },
        { status: 404 }
      );
    }

    // Verificar si ya existe otro certificado activo y no vencido para esta certificación
    const duplicateCertificate = await prisma.companyCertifications.findFirst({
      where: {
        id: { not: certId },
        companyId,
        certificationId,
        isActive: true,
        isDeleted: false,
        AND: [
          {
            OR: [
              // Si es un compromiso, verificar que no haya otro compromiso activo
              {
                isCommitment: true,
                commitmentDate: {
                  gt: new Date()
                }
              },
              // Si es un certificado, verificar que no haya otro certificado activo y no vencido
              {
                isCommitment: false,
                expirationDate: {
                  gt: new Date()
                }
              }
            ]
          },
          // Que coincida con el tipo que estamos intentando actualizar
          {
            isCommitment: isCommitment
          }
        ]
      }
    });

    if (duplicateCertificate) {
      return NextResponse.json(
        {
          success: false,
          error: isCommitment 
            ? "Ya existe un compromiso activo para esta certificación" 
            : "Ya existe un certificado activo para esta certificación",
        },
        { status: 400 }
      );
    }

    // Convertir fechas
    let parsedExpirationDate = null;
    let parsedCommitmentDate = null;

    if (expirationDate) {
      // Crear fecha en UTC
      parsedExpirationDate = new Date(expirationDate + 'T00:00:00.000Z');
      if (isNaN(parsedExpirationDate.getTime())) {
        return NextResponse.json(
          { error: "Fecha de vencimiento inválida" },
          { status: 400 }
        );
      }
    }

    if (commitmentDate) {
      // Crear fecha en UTC
      parsedCommitmentDate = new Date(commitmentDate + 'T00:00:00.000Z');
      if (isNaN(parsedCommitmentDate.getTime())) {
        return NextResponse.json(
          { error: "Fecha de compromiso inválida" },
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

    // Actualizar el certificado
    const updatedCertificate = await prisma.companyCertifications.update({
      where: {
        id: certId,
      },
      data: {
        certificationId,
        isCommitment,
        expirationDate: isCommitment ? null : parsedExpirationDate,
        commitmentDate: isCommitment ? parsedCommitmentDate : null,
        certificateFile: isCommitment ? null : certificateBuffer,
        certificateFileName: isCommitment ? null : fileName,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedCertificate,
      message: "Certificado actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar certificado:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al procesar la solicitud. Por favor, inténtelo de nuevo.",
      },
      {
        status: 500,
      }
    );
  }
}

// DELETE: Eliminar un certificado
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; certificateId: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id, certificateId } = await params;
    const companyId = parseInt(id);
    const certId = parseInt(certificateId);

    if (isNaN(companyId) || isNaN(certId)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID inválido",
        },
        { status: 400 }
      );
    }

    // Verificar si existe el certificado
    const existingCertificate = await prisma.companyCertifications.findFirst({
      where: {
        id: certId,
        companyId,
      },
    });

    if (!existingCertificate) {
      return NextResponse.json(
        {
          success: false,
          error: "Certificado no encontrado",
        },
        { status: 404 }
      );
    }

    // Eliminar el certificado (soft delete)
    await prisma.companyCertifications.update({
      where: {
        id: certId,
      },
      data: {
        isActive: false,
        isDeleted: true,
        dateDeleted: new Date(),
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Certificado eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar certificado:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al procesar la solicitud. Por favor, inténtelo de nuevo.",
      },
      {
        status: 500,
      }
    );
  }
}
