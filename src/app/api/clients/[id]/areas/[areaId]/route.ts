import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientAreaUpdateSchema } from "@/lib/schemas/client";
import { handleRouteParams } from "@/lib/route-params";

export async function PUT(
  request: Request,
  { params }: { params: { id: string; areaId: string } }
) {
  try {
    const routeParams = handleRouteParams(params);
    const { id, areaId } = routeParams;
    const clientId = parseInt(id);
    const areaIdInt = parseInt(areaId);

    if (isNaN(clientId) || isNaN(areaIdInt)) {
      return new NextResponse("Invalid ID", { status: 400 });
    }

    const json = await request.json();
    const body = clientAreaUpdateSchema.parse(json);

    if (body.areaName) {
      const existingArea = await prisma.clientAreas.findFirst({
        where: {
          clientId,
          id: {
            not: areaIdInt,
          },
          areaName: {
            equals: body.areaName,
            mode: "insensitive",
          },
          isDeleted: false,
        },
      });

      if (existingArea) {
        return new NextResponse("Ya existe un área con este nombre", {
          status: 400,
        });
      }
    }

    const area = await prisma.clientAreas.update({
      where: {
        id: areaIdInt,
        clientId,
      },
      data: body,
    });

    return NextResponse.json(area);
  } catch (error) {
    console.error("[CLIENT_AREA_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; areaId: string } }
) {
  try {
    const routeParams = handleRouteParams(params);
    const { id, areaId } = routeParams;
    const clientId = parseInt(id);
    const areaIdInt = parseInt(areaId);

    if (isNaN(clientId) || isNaN(areaIdInt)) {
      return new NextResponse("Invalid ID", { status: 400 });
    }

    await prisma.clientAreas.update({
      where: {
        id: areaIdInt,
        clientId,
      },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CLIENT_AREA_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; areaId: string } }
) {
  try {
    const routeParams = handleRouteParams(params);
    const { id, areaId } = routeParams;
    const clientId = parseInt(id);
    const areaIdInt = parseInt(areaId);

    if (isNaN(clientId) || isNaN(areaIdInt)) {
      return new NextResponse("Invalid ID", { status: 400 });
    }

    const area = await prisma.clientAreas.findUnique({
      where: {
        id: areaIdInt,
        clientId,
      },
    });

    if (!area) {
      return new NextResponse("Area not found", { status: 404 });
    }

    const updatedArea = await prisma.clientAreas.update({
      where: {
        id: areaIdInt,
        clientId,
      },
      data: {
        isActive: !area.isActive,
      },
    });

    return NextResponse.json(updatedArea);
  } catch (error) {
    console.error("[CLIENT_AREA_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
