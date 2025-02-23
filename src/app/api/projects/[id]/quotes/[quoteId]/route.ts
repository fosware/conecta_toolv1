import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { projectQuoteCreateSchema } from "@/lib/schemas/project-quote";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string; quoteId: string } }
) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id, quoteId } = await Promise.resolve(context.params);
    const projectId = Number(id);
    const quoteIdNum = Number(quoteId);

    if (isNaN(projectId) || isNaN(quoteIdNum)) {
      return NextResponse.json(
        { error: "ID de proyecto o cotización inválido" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const validatedData = projectQuoteCreateSchema.safeParse({
      ...data,
      projectId,
      userId,
    });

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validatedData.error.errors },
        { status: 400 }
      );
    }

    // Verificar que el proyecto y la cotización existen
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "El proyecto no existe" },
        { status: 404 }
      );
    }

    const existingQuote = await prisma.projectQuote.findUnique({
      where: { id: quoteIdNum },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { error: "La cotización no existe" },
        { status: 404 }
      );
    }

    if (existingQuote.projectId !== projectId) {
      return NextResponse.json(
        { error: "La cotización no pertenece a este proyecto" },
        { status: 400 }
      );
    }

    const quote = await prisma.projectQuote.update({
      where: { id: quoteIdNum },
      data: {
        companyId: validatedData.data.companyId,
        deadline: validatedData.data.deadline,
        itemDescription: validatedData.data.itemDescription,
      },
      include: {
        company: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error("[QUOTE_UPDATE]", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Error al actualizar la cotización" 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string; quoteId: string } }
) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id, quoteId } = await Promise.resolve(context.params);
    const projectId = Number(id);
    const quoteIdNum = Number(quoteId);

    if (isNaN(projectId) || isNaN(quoteIdNum)) {
      return NextResponse.json(
        { error: "ID de proyecto o cotización inválido" },
        { status: 400 }
      );
    }

    // Verificar que la cotización existe y pertenece al proyecto
    const existingQuote = await prisma.projectQuote.findFirst({
      where: {
        id: quoteIdNum,
        projectId,
      },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { error: "La cotización no existe o no pertenece a este proyecto" },
        { status: 404 }
      );
    }

    await prisma.projectQuote.delete({
      where: { id: quoteIdNum },
    });

    return NextResponse.json({
      success: true,
      message: "Cotización eliminada correctamente",
    });
  } catch (error) {
    console.error("[QUOTE_DELETE]", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Error al eliminar la cotización" 
      },
      { status: 500 }
    );
  }
}
