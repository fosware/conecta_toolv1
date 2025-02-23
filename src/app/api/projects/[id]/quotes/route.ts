import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { projectQuoteCreateSchema } from "@/lib/schemas/project-quote";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(context.params);
    const projectId = Number(id);
    
    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, error: "ID de proyecto inválido" },
        { status: 400 }
      );
    }

    const quotes = await prisma.projectQuote.findMany({
      where: {
        projectId,
        isDeleted: false,
      },
      include: {
        company: true,
      },
    });

    return NextResponse.json({ success: true, data: quotes });
  } catch (error) {
    console.error("[QUOTES_GET]", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error al cargar las cotizaciones" 
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(context.params);
    const projectId = Number(id);
    const userId = await getUserFromToken();
    
    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, error: "ID de proyecto inválido" },
        { status: 400 }
      );
    }

    const json = await request.json();
    
    // Verificar que el proyecto existe
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "El proyecto no existe" },
        { status: 404 }
      );
    }

    // Validar y crear la cotización
    const validatedData = projectQuoteCreateSchema.parse({
      ...json,
      projectId,
      userId,
    });

    const quote = await prisma.projectQuote.create({
      data: {
        companyId: validatedData.companyId,
        projectId: validatedData.projectId,
        userId: validatedData.userId,
        deadline: validatedData.deadline,
        itemDescription: validatedData.itemDescription,
      },
      include: {
        company: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: quote 
    });
  } catch (error) {
    console.error("[QUOTE_CREATE]", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error al crear la cotización" 
      },
      { status: 500 }
    );
  }
}
