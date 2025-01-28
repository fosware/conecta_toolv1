import { prisma } from "../../../../lib/prisma";
import { getUserFromToken } from "../../../../lib/get-user-from-token";
import { NextResponse } from "next/server";
import { associateCreateSchema } from "../../../../lib/schemas/associate";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const id = parseInt(context.params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const associate = await prisma.associate.findFirst({
      where: {
        id,
        userId,
        isDeleted: false,
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
        stateId: true,
        postalCode: true,
        machineCount: true,
        employeeCount: true,
        shifts: true,
        companyLogo: true,
      },
    });

    if (!associate) {
      return NextResponse.json(
        { error: "Asociado no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(associate);
  } catch (error) {
    console.error("Error getting associate:", error);
    return NextResponse.json(
      { error: "Error al obtener el asociado" },
      { status: 500 }
    );
  }
}

import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    
    // Convertir y validar tipos de datos numéricos
    const updateData = {
      companyName: formData.get("companyName")?.toString() || "",
      contactName: formData.get("contactName")?.toString() || "",
      street: formData.get("street")?.toString() || "",
      externalNumber: formData.get("externalNumber")?.toString() || "",
      internalNumber: formData.get("internalNumber")?.toString() || "",
      neighborhood: formData.get("neighborhood")?.toString() || "",
      postalCode: formData.get("postalCode")?.toString() || "",
      city: formData.get("city")?.toString() || "",
      stateId: Number(formData.get("stateId")) || 0,
      phone: formData.get("phone")?.toString() || "",
      email: formData.get("email")?.toString() || "",
      machineCount: Number(formData.get("machineCount")) || 0,
      employeeCount: Number(formData.get("employeeCount")) || 0,
      shifts: formData.get("shifts")?.toString() || "",
      achievementDescription: formData.get("achievementDescription")?.toString() || "",
      profile: formData.get("profile")?.toString() || "",
      user: { connect: { id: userId } }
    };

    // Manejar el archivo NDA
    const ndaFile = formData.get("nda") as File | null;
    if (ndaFile instanceof File) {
      const ndaBuffer = await ndaFile.arrayBuffer();
      updateData.nda = Buffer.from(ndaBuffer);
      updateData.ndaFileName = ndaFile.name;
    }

    // Manejar el logo de la empresa
    const logoFile = formData.get("companyLogo") as File | null;
    if (logoFile instanceof File) {
      // Aquí deberías implementar la lógica para subir la imagen y obtener la URL
      updateData.companyLogo = 'url_to_uploaded_image';
    } else {
      const logoUrl = formData.get("companyLogo")?.toString();
      if (logoUrl) {
        updateData.companyLogo = logoUrl;
      }
    }

    const validatedData = associateCreateSchema.omit({ 
      id: true,
      isActive: true,
      isDeleted: true,
      dateDeleted: true,
      createdAt: true,
      updatedAt: true,
      userId: true
    }).parse(updateData);

    const item = await prisma.associate.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error in PUT /asociados/[id]:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar el asociado" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const id = parseInt(context.params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar que el asociado existe y pertenece al usuario
    const associate = await prisma.associate.findFirst({
      where: {
        id,
        userId,
        isDeleted: false,
      },
    });

    if (!associate) {
      return NextResponse.json(
        { error: "Asociado no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.associate.update({
      where: { id },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting associate:", error);
    return NextResponse.json(
      { error: "Error al eliminar el asociado" },
      { status: 500 }
    );
  }
}
