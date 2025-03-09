import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { z } from "zod";

// Esquema para validar la creación de una certificación requerida
const requirementCertificationSchema = z.object({
  certificationId: z.number().int().positive(),
  observation: z.string().optional(),
});

// GET para obtener las certificaciones requeridas de una solicitud de proyecto
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente
    const { id } = await params;
    const parsedId = parseInt(id);
    
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que la solicitud existe
    const existingRequest = await prisma.projectRequest.findFirst({
      where: {
        id: parsedId,
        isDeleted: false,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    // Obtener las certificaciones requeridas
    const requirementCertifications = await prisma.requirementCertification.findMany({
      where: {
        projectRequestId: parsedId,
        isDeleted: false,
      },
      include: {
        user: true,
        certification: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      items: requirementCertifications,
    });
  } catch (error) {
    console.error("Error in GET /api/project_requests/[id]/certifications:", error);
    return NextResponse.json(
      {
        error: "Hubo un problema al procesar tu solicitud. Por favor, intenta nuevamente.",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// POST para crear una nueva certificación requerida
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente
    const { id } = await params;
    const parsedId = parseInt(id);
    
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que la solicitud existe
    const existingRequest = await prisma.projectRequest.findFirst({
      where: {
        id: parsedId,
        isDeleted: false,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    // Validar los datos de entrada
    const body = await request.json();
    const validationResult = requirementCertificationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos de certificación inválidos",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Verificar que la certificación existe
    const certification = await prisma.certifications.findFirst({
      where: {
        id: validatedData.certificationId,
        isDeleted: false,
        isActive: true,
      },
    });

    if (!certification) {
      return NextResponse.json(
        { error: "Certificación no encontrada o inactiva" },
        { status: 404 }
      );
    }

    // Verificar que la certificación no esté ya asignada a esta solicitud
    const existingRequirement = await prisma.requirementCertification.findFirst({
      where: {
        projectRequestId: parsedId,
        certificationId: validatedData.certificationId,
        isDeleted: false,
      },
    });

    if (existingRequirement) {
      return NextResponse.json(
        { error: "Esta certificación ya está asignada a la solicitud" },
        { status: 400 }
      );
    }

    // Crear la certificación requerida
    const newRequirementCertification = await prisma.requirementCertification.create({
      data: {
        projectRequestId: parsedId,
        certificationId: validatedData.certificationId,
        observation: validatedData.observation,
        userId,
      },
      include: {
        user: true,
        certification: true,
      },
    });

    return NextResponse.json({
      success: true,
      item: newRequirementCertification,
    });
  } catch (error) {
    console.error("Error in POST /api/project_requests/[id]/certifications:", error);
    return NextResponse.json(
      {
        error: "Hubo un problema al procesar tu solicitud. Por favor, intenta nuevamente.",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
