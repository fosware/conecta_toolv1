import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "@/lib/auth";
import { getUserFromToken } from "@/lib/get-user-from-token";

// Definir la interfaz para los datos de las empresas seleccionadas
interface SelectedCompany {
  id: number;
  companyId: number;
  companyName: string;
  materialCost: number;
  directCost: number;
  indirectCost: number;
}

// Obtener la cotización para cliente existente
export async function GET(
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
    const participatingCompanies = await prisma.projectRequestCompany.findMany({
      where: {
        ProjectRequirements: {
          projectRequestId: projectRequestId
        },
        isActive: true,
        isDeleted: false,
      },
      include: {
        Company: true,
        Quotation: true,
      },
    });

    const selectedCompanies = participatingCompanies
      .filter(item => item.Quotation)
      .map((item) => ({
        id: item.id,
        companyId: item.Company?.id || 0,
        companyName: item.Company?.comercialName || "Empresa sin nombre",
        materialCost: item.Quotation?.materialCost || 0,
        directCost: item.Quotation?.directCost || 0,
        indirectCost: item.Quotation?.indirectCost || 0,
      }));

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

    // Iniciar una transacción para asegurar que todas las operaciones se completen o ninguna
    const result = await prisma.$transaction(async (tx) => {
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

      // Marcar todas las cotizaciones como seleccionadas
      for (const company of participatingCompanies) {
        if (company.Quotation) {
          await tx.projectRequestRequirementQuotation.update({
            where: {
              projectRequestCompanyId: company.id,
            },
            data: {
              isClientSelected: true,
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
