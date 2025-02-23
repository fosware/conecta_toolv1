import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { projectQuoteCreateSchema } from "@/lib/schemas/project-quote";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string; quoteId: string } }
) {
  try {
    const { params } = context;
    const userId = await getUserFromToken();
    const projectId = Number(params?.id);
    const quoteId = Number(params?.quoteId);

    if (isNaN(projectId) || isNaN(quoteId)) {
      return NextResponse.json(
        { error: "ID de proyecto o cotización inválido" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const validatedData = projectQuoteCreateSchema.safeParse({
      ...data,
      projectId,
    });

    if (!validatedData.success) {
      return NextResponse.json(
        { errors: validatedData.error.errors },
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
      where: { id: quoteId },
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
      where: { id: quoteId },
      data: {
        ...validatedData.data,
        userId,
      },
      include: {
        company: true,
      },
    });

    return NextResponse.json(quote);
  } catch (error) {
    console.error("[QUOTE_UPDATE]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al actualizar la cotización" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string; quoteId: string } }
) {
  try {
    const { params } = context;
    const userId = await getUserFromToken();
    const projectId = Number(params?.id);
    const quoteId = Number(params?.quoteId);

    if (isNaN(projectId) || isNaN(quoteId)) {
      return NextResponse.json(
        { error: "ID de proyecto o cotización inválido" },
        { status: 400 }
      );
    }

    const quote = await prisma.projectQuote.update({
      where: { id: quoteId },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
        userId,
      },
      include: {
        company: true,
      },
    });

    return NextResponse.json(quote);
  } catch (error) {
    console.error("[QUOTE_DELETE]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al eliminar la cotización" },
      { status: 500 }
    );
  }
}
