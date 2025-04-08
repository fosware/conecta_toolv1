import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { NextRequest, NextResponse } from "next/server";

// POST: Subir un NDA firmado
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente
    const { id } = await params;
    const ndaId = parseInt(id);

    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el NDA existe
    const existingNDA = await prisma.clientCompanyNDA.findUnique({
      where: { id: ndaId },
    });

    if (!existingNDA) {
      return NextResponse.json(
        { 
          success: false,
          error: "NDA no encontrado" 
        },
        { status: 404 }
      );
    }

    // Obtener datos del formulario
    const formData = await request.formData();
    const signedFile = formData.get("signedFile");
    const signedDate = formData.get("signedDate") as string;

    // Validar datos
    if (!signedFile) {
      return NextResponse.json(
        { 
          success: false,
          error: "Falta el archivo firmado" 
        },
        { status: 400 }
      );
    }

    if (!signedDate) {
      return NextResponse.json(
        { 
          success: false,
          error: "Falta la fecha de firma" 
        },
        { status: 400 }
      );
    }

    // Procesar el archivo
    let signedFileName = null;
    let signedFileData = null;

    if (
      signedFile &&
      typeof signedFile === "object" &&
      "arrayBuffer" in signedFile &&
      typeof signedFile.arrayBuffer === "function"
    ) {
      const bytes = await signedFile.arrayBuffer();
      signedFileData = Buffer.from(bytes);
      signedFileName = "name" in signedFile ? (signedFile.name as string) : null;
    }

    if (!signedFileName || !signedFileData) {
      return NextResponse.json(
        { 
          success: false,
          error: "Error al procesar el archivo firmado" 
        },
        { status: 400 }
      );
    }

    // Actualizar el NDA con el archivo firmado
    const updatedNDA = await prisma.clientCompanyNDA.update({
      where: { id: ndaId },
      data: {
        ndaSignedFile: signedFileData,
        ndaSignedFileName: signedFileName,
        ndaSignedAt: new Date(signedDate),
        userId: userId
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: updatedNDA.id },
      message: "NDA firmado subido correctamente",
    });
  } catch (error) {
    console.error("[CLIENT_COMPANY_NDA_UPLOAD_SIGNED]", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Error al subir el NDA firmado" 
      },
      { status: 500 }
    );
  }
}
