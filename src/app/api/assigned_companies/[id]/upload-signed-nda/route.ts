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

    // En un entorno real, aquí subiríamos el archivo a un servicio de almacenamiento
    // como S3, Azure Blob Storage, etc.
    // Para este ejemplo, simularemos que el archivo se ha subido correctamente

    // Actualizar la asignación con la información del NDA firmado
    const updatedAssignment = await prisma.projectRequestCompany.update({
      where: {
        id: parsedId,
      },
      data: {
        ndaSignedFile: "signed_nda_file_url", // En un entorno real, esta sería la URL del archivo
        ndaSignedFileName: file.name,
        ndaSignedAt: new Date(),
        statusId: 2, // Asumiendo que el estado 2 es "En Proceso" o similar
      },
    });

    // Crear un registro de documento
    await prisma.document.create({
      data: {
        fileName: file.name,
        fileUrl: "signed_nda_file_url", // En un entorno real, esta sería la URL del archivo
        fileType: file.type,
        fileSize: file.size,
        documentTypeId: 1, // Asumiendo que el tipo 1 es "NDA"
        projectRequestCompanyId: parsedId,
        userId: userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "NDA firmado subido correctamente",
    });
  } catch (error) {
    console.error("Error en POST /api/assigned_companies/[id]/upload-signed-nda:", error);
    return NextResponse.json(
      { error: "Error al subir el NDA firmado" },
      { status: 500 }
    );
  }
}
