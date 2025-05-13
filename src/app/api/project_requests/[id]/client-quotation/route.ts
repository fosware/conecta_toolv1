import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "@/lib/auth";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

// Definir la interfaz para los datos de las empresas seleccionadas
interface SelectedCompany {
  id: number;
  companyId: number;
  companyName: string;
  materialCost: number;
  directCost: number;
  indirectCost: number;
  price: number;
}

// Obtener la cotización para cliente existente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Obtener y validar el ID del proyecto
    const { id } = await params;
    const projectRequestId = parseInt(id);
    if (isNaN(projectRequestId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Buscar la cotización para cliente existente
    const clientQuotation = await prisma.clientQuotationSummary.findFirst({
      where: {
        projectRequestId: projectRequestId,
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        projectRequestId: true,
        quotationFileName: true,
        dateQuotationClient: true,
        dateQuotationSent: true,
        clientPrice: true,
        observations: true,
      },
    });

    // Obtener las empresas participantes con sus cotizaciones
    // Filtrar directamente en la base de datos para optimizar rendimiento
    const participatingCompanies = await prisma.projectRequestCompany.findMany({
      where: {
        ProjectRequirements: {
          projectRequestId: projectRequestId
        },
        // No filtrar por statusId para incluir todos los asociados con cotizaciones
        isActive: true,
        isDeleted: false,
      },
      include: {
        Company: true,
        // Incluir todas las cotizaciones sin filtrar por isClientApproved
        Quotation: true,
      },
    });

    // Devolver todas las cotizaciones que tienen datos
    // Incluir información adicional para ayudar en la depuración
    const selectedCompanies = participatingCompanies
      .filter(item => item.Quotation)
      .map((item) => {
        // Extraer los valores directamente de la base de datos sin manipulación
        return {
          id: item.id,
          companyId: item.Company?.id || 0,
          companyName: item.Company?.comercialName || "Empresa sin nombre",
          materialCost: item.Quotation?.materialCost || 0,
          directCost: item.Quotation?.directCost || 0,
          indirectCost: item.Quotation?.indirectCost || 0,
          price: item.Quotation?.price || 0,
          isClientApproved: item.Quotation?.isClientApproved || false,
          isClientSelected: item.Quotation?.isClientSelected || false,
          statusId: item.statusId, // Incluir el estado para depuración
          projectRequirementsId: item.projectRequirementsId, // Incluir el ID del requerimiento
          quotationId: item.Quotation?.id // Incluir el ID de la cotización
        };
      });

    return NextResponse.json({
      quotation: clientQuotation,
      selectedCompanies: selectedCompanies,
    });
  } catch (error: any) {
    console.error("Error al obtener cotización para cliente:", error);
    return NextResponse.json(
      { error: "Error al obtener cotización para cliente" },
      { status: 500 }
    );
  }
}

// Crear o actualizar una cotización para cliente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Obtener y validar el ID del proyecto
    const { id } = await params;
    const projectRequestId = parseInt(id);
    if (isNaN(projectRequestId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Procesar el formulario multipart
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const clientPrice = parseFloat(formData.get("clientPrice") as string);
    const dateQuotationClient = formData.get("dateQuotationClient") as string;
    const observations = formData.get("observations") as string;

    // Validar los datos del formulario
    if (isNaN(clientPrice) || clientPrice <= 0) {
      return NextResponse.json(
        { error: "El precio para el cliente es inválido" },
        { status: 400 }
      );
    }

    if (!dateQuotationClient) {
      return NextResponse.json(
        { error: "La fecha de cotización es requerida" },
        { status: 400 }
      );
    }

    // Realizar operaciones en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Obtener los IDs de las cotizaciones seleccionadas del formulario
      const selectedQuotationIds = formData.get("selectedQuotationIds");
      let selectedIds: number[] = [];
      
      if (selectedQuotationIds) {
        try {
          selectedIds = JSON.parse(selectedQuotationIds as string);
          console.log("IDs de cotizaciones seleccionadas:", selectedIds);
        } catch (error) {
          console.error("Error al parsear los IDs de cotizaciones seleccionadas:", error);
        }
      }
      
      // Obtener todas las cotizaciones de los participantes
      const participatingCompanies = await tx.projectRequestCompany.findMany({
        where: {
          ProjectRequirements: {
            projectRequestId: projectRequestId
          },
          isActive: true,
          isDeleted: false,
        },
        include: {
          Quotation: true,
        },
      });

      // Actualizar el estado de selección de cada cotización
      for (const company of participatingCompanies) {
        if (company.Quotation) {
          // Marcar como seleccionada solo si está en la lista de IDs seleccionados
          const isSelected = selectedIds.includes(company.id);
          
          await tx.projectRequestRequirementQuotation.update({
            where: {
              projectRequestCompanyId: company.id,
            },
            data: {
              isClientSelected: isSelected,
            },
          });
        }
      }

      // Procesar el archivo si se proporcionó uno
      let quotationFile = null;
      let quotationFileName = null;

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        quotationFile = buffer;
        quotationFileName = file.name;
      }

      // Buscar si ya existe una cotización para cliente
      const existingQuotation = await tx.clientQuotationSummary.findFirst({
        where: {
          projectRequestId: projectRequestId,
          isActive: true,
          isDeleted: false,
        },
      });

      // Crear o actualizar la cotización para cliente
      let clientQuotation;
      if (existingQuotation) {
        // Actualizar la cotización existente
        clientQuotation = await tx.clientQuotationSummary.update({
          where: {
            id: existingQuotation.id,
          },
          data: {
            clientPrice: clientPrice,
            dateQuotationClient: new Date(`${dateQuotationClient}T12:00:00`),
            observations: observations,
            ...(quotationFile && { quotationFile: quotationFile }),
            ...(quotationFileName && { quotationFileName: quotationFileName }),
            updatedAt: new Date(),
            userId: userId,
          },
        });
        
        // Actualizar el estado del proyecto a "Cotización generada para Cliente" (statusId: 10)
        await tx.projectRequest.update({
          where: {
            id: projectRequestId,
          },
          data: {
            statusId: 10, // ID del estado "Cotización generada para Cliente"
          },
        });
      } else {
        // Crear una nueva cotización
        clientQuotation = await tx.clientQuotationSummary.create({
          data: {
            projectRequestId: projectRequestId,
            clientPrice: clientPrice,
            dateQuotationClient: new Date(`${dateQuotationClient}T12:00:00`),
            observations: observations,
            ...(quotationFile && { quotationFile: quotationFile }),
            ...(quotationFileName && { quotationFileName: quotationFileName }),
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            isDeleted: false,
            userId: userId,
          },
        });

        // Actualizar el estado del proyecto a "Cotización generada para Cliente" (statusId: 10)
        await tx.projectRequest.update({
          where: {
            id: projectRequestId,
          },
          data: {
            statusId: 10, // ID del estado "Cotización generada para Cliente"
          },
        });
      }

      return clientQuotation;
    });

    return NextResponse.json({
      message: "Cotización para cliente guardada correctamente",
      quotation: {
        id: result.id,
        clientPrice: result.clientPrice,
        dateQuotationClient: result.dateQuotationClient,
        dateQuotationSent: result.dateQuotationSent,
        observations: result.observations,
        quotationFileName: result.quotationFileName,
      },
    });
  } catch (error: any) {
    console.error("Error al guardar cotización para cliente:", error);
    return NextResponse.json(
      { error: "Error al guardar cotización para cliente" },
      { status: 500 }
    );
  }
}
