import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// Tamaño máximo de archivo: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Tipos de archivo permitidos
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/zip",
  "application/x-rar-compressed",
];

export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string; requirementId: string } }
) {
  try {
    // Validar token
    let userId: number;
    try {
      userId = await getUserFromToken();
    } catch (error) {
      console.error("[AUTH_ERROR]", error);
      return NextResponse.json(
        {
          error: "No autorizado",
          details: error instanceof Error ? error.message : "Error desconocido",
        },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Extraer los IDs correctamente
    const { companyId, requirementId } = await params;
    const parsedCompanyId = parseInt(companyId);
    const parsedRequirementId = parseInt(requirementId);

    if (isNaN(parsedCompanyId) || isNaN(parsedRequirementId)) {
      return NextResponse.json(
        { error: "IDs de compañía o requerimiento inválidos" },
        { status: 400 }
      );
    }

    // Verificar que la compañía y el requerimiento existen
    const companyExists = await prisma.company.findUnique({
      where: { id: parsedCompanyId },
    });

    if (!companyExists) {
      return NextResponse.json(
        { error: "Compañía no encontrada" },
        { status: 404 }
      );
    }

    const requirementExists = await prisma.projectRequirements.findUnique({
      where: { id: parsedRequirementId },
    });

    if (!requirementExists) {
      return NextResponse.json(
        { error: "Requerimiento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que la compañía está asociada al requerimiento
    //console.log("[TECHNICAL_DOCUMENT_UPLOAD] Buscando asociación entre compañía y requerimiento:", {
    //  companyId: parsedCompanyId,
    //  requirementId: parsedRequirementId
    //});

    const association = await prisma.projectRequestCompany.findFirst({
      where: {
        companyId: parsedCompanyId,
        projectRequirementsId: parsedRequirementId,
        isDeleted: false,
      },
    });

    //console.log(
    //  "[TECHNICAL_DOCUMENT_UPLOAD] Resultado de búsqueda de asociación:",
    //  association
    //);

    if (!association) {
      //console.log(
      //  "[TECHNICAL_DOCUMENT_UPLOAD] No se encontró asociación entre la compañía y el requerimiento"
      //);
      return NextResponse.json(
        { error: "La compañía no está asociada a este requerimiento" },
        { status: 403 }
      );
    }

    // Procesar el formulario
    //console.log("[TECHNICAL_DOCUMENT_UPLOAD] Procesando formData");
    const formData = await request.formData();
    /*
    console.log(
      "[TECHNICAL_DOCUMENT_UPLOAD] FormData recibido:",
      Array.from(formData.entries()).map(([key, value]) => {
        if (value instanceof File) {
          return `${key}: File (${value.name}, ${value.type}, ${value.size} bytes)`;
        }
        return `${key}: ${value}`;
      })
    );
   */
    const file = formData.get("file") as File | null;

    if (!file) {
      //console.log(
      //  "[TECHNICAL_DOCUMENT_UPLOAD] No se proporcionó ningún archivo"
      //);
      return NextResponse.json(
        { error: "No se ha proporcionado ningún archivo" },
        { status: 400 }
      );
    }

    //console.log("[TECHNICAL_DOCUMENT_UPLOAD] Archivo recibido:", {
    //  name: file.name,
    //  type: file.type,
    //  size: file.size,
    //});

    // Validar tamaño del archivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El archivo excede el tamaño máximo permitido (10MB)" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido" },
        { status: 400 }
      );
    }

    // Convertir el archivo a bytes
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = Buffer.from(fileBuffer);

    // Guardar el documento en la base de datos
    const document = await prisma.projectRequestRequirementDocuments.create({
      data: {
        projectRequestCompanyId: association.id,
        documentFile: fileBytes,
        documentFileName: file.name,
        userId: userId,
        isActive: true,
      },
    });

    // Actualizar el estado de la asociación a "Documentos técnicos enviados" (ID 6)
    //console.log(
    //  "[TECHNICAL_DOCUMENT_UPLOAD] Actualizando estado a 'Documentos técnicos enviados' (ID 6) para la asociación:",
    //  association.id
    //);
    const updatedAssociation = await prisma.projectRequestCompany.update({
      where: {
        id: association.id,
      },
      data: {
        statusId: 6, // ID 6 corresponde a "Documentos técnicos enviados"
      },
    });

    //console.log(
    //  "[TECHNICAL_DOCUMENT_UPLOAD] Asociación actualizada:",
    //  updatedAssociation
    //);

    return NextResponse.json({
      success: true,
      message: "Documento técnico subido correctamente",
      documentId: document.id,
    });
  } catch (error) {
    console.error("[TECHNICAL_DOCUMENT_UPLOAD]", error);
    return NextResponse.json(
      {
        error: "Error al subir el documento técnico",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
