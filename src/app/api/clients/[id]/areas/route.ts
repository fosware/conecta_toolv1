import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientAreaCreateSchema } from "@/lib/schemas/client";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const paramsValue = await params;
    const { id } = paramsValue;
    const clientId = parseInt(id);

    if (isNaN(clientId)) {
      return new NextResponse("Invalid client ID", { status: 400 });
    }

    const areas = await prisma.clientAreas.findMany({
      where: {
        clientId,
        isDeleted: false,
      },
      orderBy: {
        areaName: "asc",
      },
    });

    return NextResponse.json(areas);
  } catch (error) {
    console.error("[CLIENT_AREAS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const paramsValue = await params;
    const { id } = paramsValue;
    const clientId = parseInt(id);
    const body = await request.json();

    if (isNaN(clientId)) {
      return new NextResponse("Invalid client ID", { status: 400 });
    }

    const validatedData = clientAreaCreateSchema.safeParse(body);

    if (!validatedData.success) {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    const area = await prisma.clientAreas.create({
      data: {
        ...validatedData.data,
        clientId,
      },
    });

    return NextResponse.json(area);
  } catch (error) {
    console.error("[CLIENT_AREAS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
