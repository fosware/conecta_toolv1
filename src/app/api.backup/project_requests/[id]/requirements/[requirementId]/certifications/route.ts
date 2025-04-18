import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { z } from "zod";

// Esquema para validar la creación de una certificación requerida
const requirementCertificationSchema = z.object({
  certificationId: z.number().int().positive(),
  observation: z.string().optional(),
});

// GET para obtener las certificaciones requeridas de un requerimiento específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; requirementId: string } }
) {
  try {
    // Extraer los IDs correctamente
    const { id, requirementId } = await params;
    const parsedProjectId = parseInt(id);
    const parsedRequirementId = parseInt(requirementId);
    
    if (isNaN(parsedProjectId) || isNaN(parsedRequirementId)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el requerimiento existe y pertenece a la solicitud de proyecto
    const existingRequirement = await prisma.projectRequirements.findFirst({
      where: {
        id: parsedRequirementId,
        projectRequestId: parsedProjectId,
        isDeleted: false,
      },
    });

    if (!existingRequirement) {
      return NextResponse.json(
        { error: "Requerimiento no encontrado" },
        { status: 404 }
      );
    }

    // Obtener las certificaciones requeridas para este requerimiento
    const requirementCertifications = await prisma.requirementCertification.findMany({
      where: {
        projectRequirementsId: parsedRequirementId,
        isDeleted: false,
      },
      include: {
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
    console.error("Error in GET /api/project_requests/[id]/requirements/[requirementId]/certifications:", error);
    return NextResponse.json(
      {
        error: "Hubo un problema al procesar tu solicitud. Por favor, intenta nuevamente.",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// POST para crear una nueva certificación requerida para un requerimiento específico
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; requirementId: string } }
) {
  try {
    // Extraer los IDs correctamente
    const { id, requirementId } = await params;
    const parsedProjectId = parseInt(id);
    const parsedRequirementId = parseInt(requirementId);
    
    if (isNaN(parsedProjectId) || isNaN(parsedRequirementId)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el requerimiento existe y pertenece a la solicitud de proyecto
    const existingRequirement = await prisma.projectRequirements.findFirst({
      where: {
        id: parsedRequirementId,
        projectRequestId: parsedProjectId,
        isDeleted: false,
      },
    });

    if (!existingRequirement) {
      return NextResponse.json(
        { error: "Requerimiento no encontrado" },
        { status: 404 }
      );
    }

    // Validar los datos de entrada
    const requestBody = await request.json();
    const validationResult = requirementCertificationSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    // Verificar que la certificación existe
    const existingCertification = await prisma.certifications.findFirst({
      where: {
        id: validationResult.data.certificationId,
        isActive: true,
      },
    });

    if (!existingCertification) {
      return NextResponse.json(
        { error: "Certificación no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la certificación no esté ya asignada a este requerimiento
    const existingRequirementCertification = await prisma.requirementCertification.findFirst({
      where: {
        projectRequirementsId: parsedRequirementId,
        certificationId: validationResult.data.certificationId,
        isDeleted: false,
      },
    });

    if (existingRequirementCertification) {
      return NextResponse.json(
        { error: "Esta certificación ya está asignada a este requerimiento" },
        { status: 400 }
      );
    }

    // Crear la nueva certificación requerida
    const newRequirementCertification = await prisma.requirementCertification.create({
      data: {
        projectRequirementsId: parsedRequirementId,
        certificationId: validationResult.data.certificationId,
        observation: validationResult.data.observation,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      item: newRequirementCertification,
    });
  } catch (error) {
    console.error("Error in POST /api/project_requests/[id]/requirements/[requirementId]/certifications:", error);
    return NextResponse.json(
      {
        error: "Hubo un problema al procesar tu solicitud. Por favor, intenta nuevamente.",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
