import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientCreateSchema } from "@/lib/schemas/client";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromToken();
    const { id } = await context.params;
    const clientId = parseInt(id);
    const body = await request.json();

    const validatedData = clientCreateSchema.parse(body);

    // Verificar si el cliente existe
    const existingClient = await prisma.clients.findUnique({
      where: { id: clientId },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si ya existe otro cliente con el mismo RFC
    const duplicateClient = await prisma.clients.findFirst({
      where: {
        rfc: { equals: validatedData.rfc, mode: "insensitive" },
        isDeleted: false,
        NOT: { id: clientId },
      },
    });

    if (duplicateClient) {
      return NextResponse.json(
        { error: "Ya existe otro cliente con este RFC" },
        { status: 400 }
      );
    }

    const client = await prisma.clients.update({
      where: { id: clientId },
      data: {
        ...validatedData,
        userId,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar el cliente",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromToken();
    const { id } = await context.params;
    const clientId = parseInt(id);

    // Verificar si el cliente existe
    const existingClient = await prisma.clients.findUnique({
      where: { id: clientId },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    await prisma.clients.update({
      where: { id: clientId },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
        userId,
      },
    });

    return NextResponse.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al eliminar el cliente",
      },
      { status: 500 }
    );
  }
}
