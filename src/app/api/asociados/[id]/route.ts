import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { z } from "zod";

const updateAssociateSchema = z.object({
  companyName: z.string(),
  contactName: z.string(),
  street: z.string(),
  externalNumber: z.string(),
  internalNumber: z.string().optional().nullable(),
  neighborhood: z.string(),
  postalCode: z.string(),
  city: z.string(),
  stateId: z.number(),
  phone: z.string(),
  email: z.string().email(),
  machineCount: z.number(),
  employeeCount: z.number(),
  shifts: z.string(),
  isActive: z.boolean(),
});

// GET: Obtener un asociado por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const associateId = parseInt(params.id);

    if (isNaN(associateId)) {
      return NextResponse.json(
        { error: "ID de asociado inválido" },
        { status: 400 }
      );
    }

    const associate = await prisma.associate.findFirst({
      where: {
        id: associateId,
        isDeleted: false,
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
    console.error("Error al obtener asociado:", error);
    return NextResponse.json(
      { error: "Error al obtener el asociado" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar un asociado
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const formData = await request.formData();
    const associateId = parseInt(params.id);

    if (isNaN(associateId)) {
      return NextResponse.json(
        { error: "ID de asociado inválido" },
        { status: 400 }
      );
    }

    // Verificar que el asociado existe
    const existingAssociate = await prisma.associate.findFirst({
      where: {
        id: associateId,
        isDeleted: false,
      },
    });

    if (!existingAssociate) {
      return NextResponse.json(
        { error: "Asociado no encontrado" },
        { status: 404 }
      );
    }

    // Construir el objeto de datos
    const data = {
      companyName: formData.get("companyName")?.toString() || existingAssociate.companyName,
      contactName: formData.get("contactName")?.toString() || existingAssociate.contactName,
      street: formData.get("street")?.toString() || existingAssociate.street,
      externalNumber: formData.get("externalNumber")?.toString() || existingAssociate.externalNumber,
      internalNumber: formData.get("internalNumber")?.toString() || existingAssociate.internalNumber,
      neighborhood: formData.get("neighborhood")?.toString() || existingAssociate.neighborhood,
      postalCode: formData.get("postalCode")?.toString() || existingAssociate.postalCode,
      city: formData.get("city")?.toString() || existingAssociate.city,
      stateId: parseInt(formData.get("stateId")?.toString() || "") || existingAssociate.stateId,
      phone: formData.get("phone")?.toString() || existingAssociate.phone,
      email: formData.get("email")?.toString() || existingAssociate.email,
      machineCount: parseInt(formData.get("machineCount")?.toString() || "") || existingAssociate.machineCount,
      employeeCount: parseInt(formData.get("employeeCount")?.toString() || "") || existingAssociate.employeeCount,
      shifts: formData.get("shifts")?.toString() || existingAssociate.shifts,
      isActive: existingAssociate.isActive,
    };

    // Verificar si el email ya existe
    if (data.email && data.email !== existingAssociate.email) {
      const emailExists = await prisma.associate.findFirst({
        where: {
          email: data.email,
          id: {
            not: associateId,
          },
          isDeleted: false,
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "El email ya está registrado" },
          { status: 400 }
        );
      }
    }

    // Validar los datos
    const validatedData = updateAssociateSchema.parse(data);

    // Actualizar el asociado
    const updatedAssociate = await prisma.associate.update({
      where: {
        id: associateId,
      },
      data: {
        ...validatedData,
        userId,
      },
    });

    return NextResponse.json({
      message: "Asociado actualizado correctamente",
      associate: updatedAssociate,
    });
  } catch (error) {
    console.error("Error al actualizar asociado:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar el asociado" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un asociado
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const associateId = parseInt(params.id);

    if (isNaN(associateId)) {
      return NextResponse.json(
        { error: "ID de asociado inválido" },
        { status: 400 }
      );
    }

    // Verificar que el asociado exista
    const associate = await prisma.associate.findFirst({
      where: {
        id: associateId,
        isDeleted: false,
      },
    });

    if (!associate) {
      return NextResponse.json(
        { error: "Asociado no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar lógicamente el asociado
    await prisma.associate.update({
      where: {
        id: associateId,
      },
      data: {
        isDeleted: true,
        isActive: false,
        dateDeleted: new Date(),
      },
    });

    return NextResponse.json({
      message: "Asociado eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar asociado:", error);
    return NextResponse.json(
      { error: "Error al eliminar el asociado" },
      { status: 500 }
    );
  }
}
