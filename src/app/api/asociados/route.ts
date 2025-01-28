import { prisma } from "../../../lib/prisma";
import { getUserFromToken } from "../../../lib/get-user-from-token";
import { NextRequest, NextResponse } from "next/server";
import { associateCreateSchema } from "../../../lib/schemas/associate";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const showActive = searchParams.get("showActive") === "true";

    const items = await prisma.associate.findMany({
      where: {
        OR: [
          { companyName: { contains: search, mode: "insensitive" } },
          { contactName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
        isDeleted: false,
        ...(showActive && { isActive: true }),
      },
      orderBy: {
        companyName: "asc",
      },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        email: true,
        phone: true,
        isActive: true,
        street: true,
        externalNumber: true,
        internalNumber: true,
        neighborhood: true,
        city: true,
        postalCode: true,
        machineCount: true,
        employeeCount: true,
        shifts: true,
        stateId: true,
        companyLogo: true,
        nda: false,
        ndaFileName: true,
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error in GET /asociados/api:", error);
    return NextResponse.json(
      { error: "Error al obtener los asociados" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    const formData = await request.formData();
    
    // Handle NDA file
    const ndaFile = formData.get("nda") as File | null;
    let ndaBuffer = null;
    let ndaFileName = null;
    
    if (ndaFile) {
      if (!ndaFile.type.includes("pdf")) {
        return NextResponse.json(
          { error: "El NDA debe ser un archivo PDF" },
          { status: 400 }
        );
      }
      if (ndaFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "El NDA no debe exceder 5MB" },
          { status: 400 }
        );
      }
      ndaBuffer = Buffer.from(await ndaFile.arrayBuffer());
      ndaFileName = ndaFile.name;
    }

    const data = {
      companyName: formData.get("companyName"),
      contactName: formData.get("contactName"),
      street: formData.get("street"),
      externalNumber: formData.get("externalNumber"),
      internalNumber: formData.get("internalNumber"),
      neighborhood: formData.get("neighborhood"),
      postalCode: formData.get("postalCode"),
      city: formData.get("city"),
      stateId: Number(formData.get("stateId")),
      phone: formData.get("phone"),
      email: formData.get("email"),
      machineCount: Number(formData.get("machineCount")),
      employeeCount: Number(formData.get("employeeCount")),
      shifts: formData.get("shifts"),
      achievementDescription: formData.get("achievementDescription"),
      profile: formData.get("profile"),
      nda: ndaBuffer,
      ndaFileName,
      userId,
    };

    const validatedData = associateCreateSchema.parse(data);

    const item = await prisma.associate.create({
      data: validatedData,
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error in POST /asociados/api:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Ya existe un asociado con ese nombre" },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { error: "Error al crear el asociado" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserFromToken();
    const data = await request.json();
    const { id, ...updateData } = data;

    const associate = await prisma.associate.update({
      where: { id },
      data: {
        ...updateData,
        userId,
      },
    });

    return NextResponse.json(associate);
  } catch (error) {
    console.error("Error in PUT /asociados/api:", error);
    return NextResponse.json(
      { error: "Error al actualizar el asociado" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    await prisma.associate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /asociados/api:", error);
    return NextResponse.json(
      { error: "Error al eliminar el asociado" },
      { status: 500 }
    );
  }
}
