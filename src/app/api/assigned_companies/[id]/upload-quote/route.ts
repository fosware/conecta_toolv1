import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente según las mejores prácticas de Next.js 15
    const { id } = await params;
    const parsedId = parseInt(id);

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener el registro de ProjectRequestCompany
    const projectRequestCompany = await prisma.projectRequestCompany.findFirst({
      where: {
        id: parsedId,
        isDeleted: false,
      },
      include: {
        status: true,
      },
    });

    if (!projectRequestCompany) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el estado sea válido para subir cotización
    const validStatusIds = [6, 7, 8, 9]; // Documentos técnicos enviados, Cotización enviada, Cotización rechazada, Cotización aprobada
    if (!validStatusIds.includes(projectRequestCompany.statusId)) {
      return NextResponse.json(
        {
          error:
            "No se puede subir una cotización en el estado actual del registro",
        },
        { status: 400 }
      );
    }

    // Procesar el archivo
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No se ha proporcionado un archivo válido" },
        { status: 400 }
      );
    }

    // Obtener el nombre del archivo
    let fileName = "cotizacion.pdf";
    if ("name" in file && file.name) {
      fileName = file.name;
    }

    // Leer el archivo como un ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    // Verificar que el archivo no esté vacío
    if (fileBytes.length === 0) {
      return NextResponse.json(
        { error: "El archivo está vacío" },
        { status: 400 }
      );
    }

    try {
      // Guardar el archivo en la base de datos
      // Convertimos el archivo a un Buffer binario y lo codificamos en base64 para evitar problemas de codificación UTF-8
      const base64Data = Buffer.from(fileBytes).toString('base64');
      
      const quoteDocument = await prisma.projectRequestRequirementQuotation.upsert({
        where: {
          projectRequestCompanyId: parsedId,
        },
        update: {
          quotationFile: Buffer.from(base64Data, 'base64'),
          quotationFileName: fileName,
          isActive: true,
          userId: userId,
        },
        create: {
          projectRequestCompanyId: parsedId,
          quotationFile: Buffer.from(base64Data, 'base64'),
          quotationFileName: fileName,
          isActive: true,
          userId: userId,
        },
      });

      // Actualizar el estado a "Cotización enviada" (ID: 7)
      await prisma.projectRequestCompany.update({
        where: {
          id: parsedId,
        },
        data: {
          statusId: 7, // Cotización enviada
        },
      });

      return NextResponse.json(
        {
          message: "Cotización subida correctamente",
          documentId: quoteDocument.id,
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Error en la base de datos:", dbError);
      return NextResponse.json(
        { error: "Error al guardar la cotización en la base de datos" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error en POST /api/assigned_companies/[id]/upload-quote:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
