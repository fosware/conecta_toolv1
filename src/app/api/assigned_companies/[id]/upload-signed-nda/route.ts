import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Extraer el ID correctamente según las prácticas de Next.js 15
    const { id } = await params;
    const parsedId = parseInt(id);

    // Verificar que la asignación existe
    const assignedCompany = await prisma.projectRequestCompany.findUnique({
      where: {
        id: parsedId,
        isDeleted: false,
      },
    });

    if (!assignedCompany) {
      return NextResponse.json(
        { error: "Asignación no encontrada" },
        { status: 404 }
      );
    }

    // Procesar el archivo
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se ha proporcionado ningún archivo" },
        { status: 400 }
      );
    }

    // Convertir el archivo a un ArrayBuffer y luego a Uint8Array para Prisma
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    // En un entorno real, aquí subiríamos el archivo a un servicio de almacenamiento
    // como S3, Azure Blob Storage, etc.
    // Para este ejemplo, simularemos que el archivo se ha subido correctamente

    // Preparar los datos para la actualización
    const updateData: any = {
      ndaSignedFile: fileBytes, // Usar Uint8Array en lugar de string
      ndaSignedFileName: file.name,
      ndaSignedAt: new Date(),
      statusId: 4, // Cambiar a estado "Firmado por Asociado" (ID 4) cuando se sube un NDA firmado
    };

    // Actualizar la asignación con la información del NDA firmado
    const updatedAssignment = await prisma.projectRequestCompany.update({
      where: {
        id: parsedId,
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "NDA firmado subido correctamente",
    });
  } catch (error) {
    console.error("Error al subir NDA firmado:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
