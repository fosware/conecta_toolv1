import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente (Next.js 15)
    const { id } = await params;
    const projectRequestId = parseInt(id);

    // Verificar que el ID sea válido
    if (isNaN(projectRequestId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Obtener documentos técnicos de la solicitud
    const documents = await prisma.projectRequestDocuments.findMany({
      where: {
        projectRequestId,
        isDeleted: false,
        isActive: true,
      },
      select: {
        id: true,
        documentFileName: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error("Error al obtener documentos técnicos:", error);
    return NextResponse.json(
      { error: "Error al obtener documentos técnicos" },
      { status: 500 }
    );
  }
}
