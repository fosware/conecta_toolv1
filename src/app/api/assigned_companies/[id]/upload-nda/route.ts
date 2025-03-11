import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente según las mejores prácticas de Next.js 15
    const { id } = await params;
    const parsedId = parseInt(id);

    // Verificar autenticación
    // const session = await getServerSession(authOptions);
    if (false) { // Autenticación deshabilitada temporalmente
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar que el registro existe
    const projectRequestCompany = await prisma.projectRequestCompany.findUnique({
      where: {
        id: parsedId,
        isDeleted: false,
      },
    });

    if (!projectRequestCompany) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      );
    }

    // Procesar el archivo
    const formData = await request.formData();
    const ndaSignedFile = formData.get("ndaSignedFile") as File;

    if (!ndaSignedFile) {
      return NextResponse.json(
        { error: "No se proporcionó un archivo" },
        { status: 400 }
      );
    }

    // Leer el archivo como ArrayBuffer
    const arrayBuffer = await ndaSignedFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Actualizar el registro con el archivo firmado
    const updated = await prisma.projectRequestCompany.update({
      where: {
        id: parsedId,
      },
      data: {
        ndaSignedFile: buffer,
        ndaSignedFileName: ndaSignedFile.name,
        ndaSignedAt: new Date(),
        statusId: 4, // Actualizar al estado "Firmado por Asociado"
        updatedAt: new Date(),
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "NDA firmado subido correctamente",
    });
  } catch (error) {
    console.error("Error en POST /api/assigned_companies/[id]/upload-nda:", error);
    return NextResponse.json(
      { error: "Error al subir el NDA firmado" },
      { status: 500 }
    );
  }
}
