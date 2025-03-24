import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { ProjectRequestLogsService } from "@/lib/services/project-request-logs";

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
    let fileName = "";
    let base64Data = "";

    const formDataFile = formData.get("file");
    
    if (formDataFile && formDataFile instanceof File) {
      // Obtener el nombre del archivo
      fileName = formDataFile.name;
      
      // Leer el archivo como un ArrayBuffer
      const fileBytes = await formDataFile.arrayBuffer();
      
      // Convertimos el archivo a un Buffer binario y lo codificamos en base64 para evitar problemas de codificación UTF-8
      base64Data = Buffer.from(fileBytes).toString('base64');
    }

    // Obtener los nuevos campos del formulario
    const materialCostStr = formData.get("materialCost")?.toString() || "0";
    const directCostStr = formData.get("directCost")?.toString() || "0";
    const indirectCostStr = formData.get("indirectCost")?.toString() || "0";
    const projectTypesIdStr = formData.get("projectTypesId")?.toString() || "1";
    const additionalDetails = formData.get("additionalDetails")?.toString() || "";
    
    // Convertir a los tipos correctos
    const materialCost = materialCostStr ? parseFloat(materialCostStr) : null;
    const directCost = directCostStr ? parseFloat(directCostStr) : null;
    const indirectCost = indirectCostStr ? parseFloat(indirectCostStr) : null;
    const projectTypesId = parseInt(projectTypesIdStr);
    
    // Obtener los segmentos como JSON
    let segments = [];
    try {
      const segmentsJson = formData.get("segments")?.toString();
      if (segmentsJson) {
        segments = JSON.parse(segmentsJson);
      }
    } catch (error) {
      console.error("Error al parsear segmentos:", error);
      return NextResponse.json(
        { error: "Formato de segmentos inválido" },
        { status: 400 }
      );
    }

    // Verificar que haya al menos un segmento
    if (!segments || segments.length === 0) {
      return NextResponse.json(
        { error: "Debe proporcionar al menos un segmento de entrega" },
        { status: 400 }
      );
    }

    try {
      // Verificar si ya existe una cotización para este proyecto
      const existingQuote = await prisma.projectRequestRequirementQuotation.findUnique({
        where: {
          projectRequestCompanyId: parsedId,
        },
      });

      let quoteDocument;
      
      if (existingQuote) {
        // Actualizar la cotización existente
        const updateData: any = {
          materialCost,
          directCost,
          indirectCost,
          projectTypesId,
          additionalDetails,
          isActive: true,
          userId,
        };

        // Solo actualizar el archivo si se proporcionó uno nuevo
        if (base64Data) {
          updateData.quotationFile = Buffer.from(base64Data, 'base64');
          updateData.quotationFileName = fileName;
        }

        quoteDocument = await prisma.projectRequestRequirementQuotation.update({
          where: {
            id: existingQuote.id,
          },
          data: updateData,
        });
      } else {
        // Si es una nueva cotización, el archivo es obligatorio
        if (!base64Data) {
          return NextResponse.json(
            { error: "El archivo es obligatorio para crear una nueva cotización" },
            { status: 400 }
          );
        }

        // Crear una nueva cotización
        quoteDocument = await prisma.projectRequestRequirementQuotation.create({
          data: {
            projectRequestCompanyId: parsedId,
            quotationFile: Buffer.from(base64Data, 'base64'),
            quotationFileName: fileName,
            materialCost,
            directCost,
            indirectCost,
            projectTypesId,
            additionalDetails,
            isActive: true,
            isDeleted: false,
            userId,
          },
        });
      }

      // Eliminar segmentos existentes (si los hay)
      await prisma.quotationSegment.deleteMany({
        where: {
          projectRequestRequirementQuotationId: quoteDocument.id,
        },
      });

      // Crear los nuevos segmentos
      for (const segment of segments) {
        await prisma.quotationSegment.create({
          data: {
            projectRequestRequirementQuotationId: quoteDocument.id,
            estimatedDeliveryDate: new Date(segment.estimatedDeliveryDate),
            description: segment.description,
            isActive: true,
            userId: userId,
          },
        });
      }

      // Actualizar el estado a "Cotización enviada" (ID: 7)
      await prisma.projectRequestCompany.update({
        where: {
          id: parsedId,
        },
        data: {
          statusId: 7, // Cotización enviada
        },
      });

      // Crear un log del sistema cuando se sube una cotización
      await ProjectRequestLogsService.createSystemLog(
        parsedId,
        "QUOTATION_SENT",
        userId
      );

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
