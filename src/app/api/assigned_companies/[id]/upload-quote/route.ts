import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { ProjectRequestLogsService } from "@/lib/services/project-request-logs";
import { handleRouteParams } from "@/lib/route-params";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente según las mejores prácticas de Next.js
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

    // Obtener los datos del formulario
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const materialCost = formData.get("materialCost") as string;
    const directCost = formData.get("directCost") as string;
    const indirectCost = formData.get("indirectCost") as string;
    const price = formData.get("price") as string;
    const projectTypesId = formData.get("projectTypesId") as string;
    const additionalDetails = formData.get("additionalDetails") as string;
    const segmentsJson = formData.get("segments") as string;

    // Parsear los segmentos
    const segments = JSON.parse(segmentsJson || "[]");

    // Verificar que haya al menos un segmento
    if (!segments || segments.length === 0) {
      return NextResponse.json(
        { error: "Debe proporcionar al menos un segmento de entrega" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una cotización para esta asignación
    const existingQuotation = await prisma.projectRequestRequirementQuotation.findUnique({
      where: {
        projectRequestCompanyId: parsedId,
      },
    });

    let fileName = existingQuotation?.quotationFileName || null;

    // Si hay un archivo nuevo, guardarlo
    if (file) {
      // Leer el archivo como buffer para guardarlo en la base de datos
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      
      // Guardar el nombre del archivo original
      fileName = file.name;
    }

    // Crear o actualizar la cotización
    let quotation;
    if (existingQuotation) {
      // Actualizar cotización existente
      quotation = await prisma.projectRequestRequirementQuotation.update({
        where: {
          id: existingQuotation.id,
        },
        data: {
          materialCost: materialCost ? parseFloat(materialCost) : undefined,
          directCost: directCost ? parseFloat(directCost) : undefined,
          indirectCost: indirectCost ? parseFloat(indirectCost) : undefined,
          price: price ? parseFloat(price) : undefined,
          projectTypesId: projectTypesId ? parseInt(projectTypesId) : undefined,
          additionalDetails,
          ...(fileName ? { quotationFileName: fileName } : {}),
          ...(file ? { quotationFile: Buffer.from(await file.arrayBuffer()) } : {}),
          userId: userId, // Añadir userId para cumplir con el esquema
        },
      });

      // Actualizar segmentos existentes a inactivos
      await prisma.quotationSegment.updateMany({
        where: {
          projectRequestRequirementQuotationId: existingQuotation.id,
        },
        data: {
          isActive: false,
          isDeleted: true,
        },
      });

      // Crear log de sistema para actualización
      await ProjectRequestLogsService.createSystemLog(
        parsedId,
        "QUOTATION_SENT",
        userId
      );
    } else {
      // Crear nueva cotización
      quotation = await prisma.projectRequestRequirementQuotation.create({
        data: {
          projectRequestCompanyId: parsedId,
          materialCost: materialCost ? parseFloat(materialCost) : undefined,
          directCost: directCost ? parseFloat(directCost) : undefined,
          indirectCost: indirectCost ? parseFloat(indirectCost) : undefined,
          price: price ? parseFloat(price) : undefined,
          projectTypesId: projectTypesId ? parseInt(projectTypesId) : undefined,
          additionalDetails,
          quotationFileName: fileName,
          quotationFile: file ? Buffer.from(await file.arrayBuffer()) : undefined,
          userId: userId, // Añadir userId para cumplir con el esquema
          isActive: true,
          isDeleted: false,
        },
      });

      // Crear log de sistema
      await ProjectRequestLogsService.createSystemLog(
        parsedId,
        "QUOTATION_SENT",
        userId
      );
    }

    // Actualizar el estado del asociado-requerimiento a "Cotización enviada" (ID 7)
    // Solo actualizamos el estado en ProjectRequestCompany (lo que se muestra en la UI)
    await prisma.projectRequestCompany.update({
      where: {
        id: parsedId,
      },
      data: {
        statusId: 7, // "Cotización enviada"
      },
    });

    // No actualizamos el estado en ProjectRequest ya que es a nivel de asociado-requerimiento

    // Crear nuevos segmentos
    for (const segment of segments) {
      await prisma.quotationSegment.create({
        data: {
          projectRequestRequirementQuotationId: quotation.id,
          estimatedDeliveryDate: new Date(segment.estimatedDeliveryDate),
          description: segment.description,
          isActive: true,
          userId: userId, // Añadir userId para cumplir con el esquema
          isDeleted: false,
        },
      });
    }

    return NextResponse.json(
      { message: "Cotización guardada correctamente", quotation },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en POST /api/assigned_companies/[id]/upload-quote:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
