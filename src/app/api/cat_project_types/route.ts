import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const catProjectTypes = await prisma.projectTypes.findMany({
      where: { isDeleted: false },
    });
    return NextResponse.json(catProjectTypes);
  } catch (error) {
    console.log(error);
    return NextResponse.error();
  }
}
