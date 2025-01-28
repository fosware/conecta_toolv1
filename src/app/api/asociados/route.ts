import { prisma } from "../../../lib/prisma";
import { getUserFromToken } from "../../../lib/get-user-from-token";
import { NextRequest, NextResponse } from "next/server";
import { associateCreateSchema } from "../../../lib/schemas/associate";
import { Prisma, Associate } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showActive = searchParams.get("showActive") === "true";

    const associates = await prisma.associate.findMany({
      where: {
        isDeleted: false,
        ...(showActive && { isActive: true }),
      },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        street: true,
        externalNumber: true,
        internalNumber: true,
        neighborhood: true,
        postalCode: true,
        city: true,
        phone: true,
        email: true,
        machineCount: true,
        employeeCount: true,
        shifts: true,
        locationState: {
          select: {
            id: true,
            name: true
          }
        },
        companyLogo: true,
        nda: false,
        ndaFileName: true,
        isActive: true,
        achievementDescription: true,
        profile: true,
        userId: true,
        stateId: true
      },
      orderBy: {
        companyName: "asc",
      },
    });

    return NextResponse.json({ items: associates });
  } catch (error) {
    console.error("Error in GET /api/asociados:", error);
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

    // Handle logo file
    const logoFile = formData.get("companyLogo");
    let companyLogo = null;
    if (logoFile && typeof logoFile === 'string') {
      companyLogo = logoFile;
    }

    // Handle NDA file
    const ndaFile = formData.get("nda") as File | null;
    let ndaBuffer: Uint8Array | null = null;
    let ndaFileName = null;
    
    if (ndaFile && ndaFile instanceof File) {
      const bytes = await ndaFile.arrayBuffer();
      ndaBuffer = new Uint8Array(bytes);
      ndaFileName = ndaFile.name;
    }

    // Construir el objeto de datos para validación
    const validationData = {
      companyName: formData.get("companyName") as string,
      contactName: formData.get("contactName") as string,
      street: formData.get("street") as string,
      externalNumber: formData.get("externalNumber") as string,
      internalNumber: formData.get("internalNumber") as string || null,
      neighborhood: formData.get("neighborhood") as string,
      postalCode: formData.get("postalCode") as string,
      city: formData.get("city") as string,
      stateId: parseInt(formData.get("stateId") as string),
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      machineCount: parseInt(formData.get("machineCount") as string),
      employeeCount: parseInt(formData.get("employeeCount") as string),
      shifts: formData.get("shifts") as string || "",
      achievementDescription: formData.get("achievementDescription") as string || null,
      profile: formData.get("profile") as string || null,
    };

    // Validar que no exista otro asociado con el mismo correo o nombre de empresa
    const existingByEmail = await prisma.associate.findFirst({
      where: {
        email: validationData.email,
        isDeleted: false,
      },
    });

    if (existingByEmail) {
      return NextResponse.json(
        { error: "Ya existe un asociado con ese correo electrónico" },
        { status: 400 }
      );
    }

    const existingByName = await prisma.associate.findFirst({
      where: {
        companyName: validationData.companyName,
        isDeleted: false,
      },
    });

    if (existingByName) {
      return NextResponse.json(
        { error: "Ya existe un asociado con ese nombre de empresa" },
        { status: 400 }
      );
    }

    // Validar los datos
    const validationResult = associateCreateSchema.safeParse(validationData);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return NextResponse.json(
        { error: "Error de validación", details: errors },
        { status: 400 }
      );
    }

    // Construir el objeto de datos para Prisma
    const data: Prisma.AssociateCreateInput = {
      companyName: validationData.companyName,
      contactName: validationData.contactName,
      street: validationData.street,
      externalNumber: validationData.externalNumber,
      internalNumber: validationData.internalNumber,
      neighborhood: validationData.neighborhood,
      postalCode: validationData.postalCode,
      city: validationData.city,
      phone: validationData.phone,
      email: validationData.email,
      machineCount: validationData.machineCount,
      employeeCount: validationData.employeeCount,
      shifts: validationData.shifts,
      achievementDescription: validationData.achievementDescription,
      profile: validationData.profile,
      isActive: true,
      locationState: {
        connect: {
          id: validationData.stateId
        }
      },
      user: userId ? {
        connect: {
          id: userId
        }
      } : undefined
    };

    // Agregar logo y NDA solo si existen
    if (companyLogo) {
      data.companyLogo = companyLogo;
    }
    if (ndaBuffer) {
      data.nda = ndaBuffer;
      data.ndaFileName = ndaFileName;
    }

    // Crear el asociado
    const associate = await prisma.associate.create({
      data: data,
    });

    return NextResponse.json({ data: associate });
  } catch (error) {
    console.error("Error in POST /api/asociados:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear el asociado" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const formData = await request.formData();
    const id = parseInt(params.id);

    // Handle logo file
    const logoFile = formData.get("companyLogo");
    let companyLogo = null;
    if (logoFile && typeof logoFile === 'string') {
      companyLogo = logoFile;
    }

    // Handle NDA file
    const ndaFile = formData.get("nda") as File | null;
    let ndaBuffer: Uint8Array | null = null;
    let ndaFileName = null;
    
    if (ndaFile && ndaFile instanceof File) {
      const bytes = await ndaFile.arrayBuffer();
      ndaBuffer = new Uint8Array(bytes);
      ndaFileName = ndaFile.name;
    }

    // Construir el objeto de datos para validación
    const validationData = {
      companyName: formData.get("companyName") as string,
      contactName: formData.get("contactName") as string,
      street: formData.get("street") as string,
      externalNumber: formData.get("externalNumber") as string,
      internalNumber: formData.get("internalNumber") as string || null,
      neighborhood: formData.get("neighborhood") as string,
      postalCode: formData.get("postalCode") as string,
      city: formData.get("city") as string,
      stateId: parseInt(formData.get("stateId") as string),
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      machineCount: parseInt(formData.get("machineCount") as string),
      employeeCount: parseInt(formData.get("employeeCount") as string),
      shifts: formData.get("shifts") as string || "",
      achievementDescription: formData.get("achievementDescription") as string || null,
      profile: formData.get("profile") as string || null,
    };

    // Validar los datos
    const validationResult = associateCreateSchema.safeParse(validationData);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return NextResponse.json(
        { error: "Error de validación", details: errors },
        { status: 400 }
      );
    }

    // Construir el objeto de datos para Prisma
    const data: Prisma.AssociateUpdateInput = {
      ...validationResult.data,
      locationState: {
        connect: {
          id: validationResult.data.stateId
        }
      },
      user: userId ? {
        connect: {
          id: userId
        }
      } : undefined
    };

    // Agregar logo y NDA solo si existen
    if (companyLogo) {
      data.companyLogo = companyLogo;
    }
    if (ndaBuffer) {
      data.nda = ndaBuffer;
      data.ndaFileName = ndaFileName;
    }

    // Validar que no exista otro asociado con el mismo correo o nombre de empresa
    const existingByEmail = await prisma.associate.findFirst({
      where: {
        email: data.email as string,
        id: { not: id },
        isDeleted: false,
      },
    });

    if (existingByEmail) {
      return NextResponse.json(
        { error: "Ya existe un asociado con ese correo electrónico" },
        { status: 400 }
      );
    }

    const existingByName = await prisma.associate.findFirst({
      where: {
        companyName: data.companyName as string,
        id: { not: id },
        isDeleted: false,
      },
    });

    if (existingByName) {
      return NextResponse.json(
        { error: "Ya existe un asociado con ese nombre de empresa" },
        { status: 400 }
      );
    }

    // Actualizar el asociado
    const associate = await prisma.associate.update({
      where: { id },
      data: data,
    });

    return NextResponse.json({ data: associate });
  } catch (error) {
    console.error("Error in PUT /api/asociados/[id]:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = error.meta?.target as string[];
        if (target?.includes("email")) {
          return NextResponse.json(
            { error: "Ya existe un asociado con ese correo electrónico" },
            { status: 400 }
          );
        } else if (target?.includes("companyName")) {
          return NextResponse.json(
            { error: "Ya existe un asociado con ese nombre de empresa" },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al actualizar el asociado" },
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
