import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const catClients = await prisma.clients.findMany({
      where: {
        isDeleted: false,
      },
    });
    return NextResponse.json(catClients);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener los clientes" },
      { status: 500 }
    );
  }
}
