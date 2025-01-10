import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      select: { id: true, name: true },
    });
    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error al obtener roles:", error);
    return NextResponse.json(
      { message: "Error al obtener roles." },
      { status: 500 }
    );
  }
}
