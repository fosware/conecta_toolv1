import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { z } from "zod";

const updateCompanySchema = z.object({
  companyName: z.string().optional(),
  contactName: z.string().optional(),
  street: z.string().optional(),
  externalNumber: z.string().optional(),
  internalNumber: z.string().optional(),
  neighborhood: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  stateId: z.coerce.number().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  machineCount: z.coerce.number().optional(),
  employeeCount: z.coerce.number().optional(),
  shifts: z.string().optional(),
  companyLogo: z.string().nullable().optional(),
  nda: z.instanceof(Buffer).nullable().optional(),
  ndaFileName: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

// GET: Obtener una empresa por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id } = await params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "ID de empresa inválido" },
        { status: 400 }
      );
    }

    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        isDeleted: false,
      },
      include: {
        locationState: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!company) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ items: [company] });
  } catch (error) {
    console.error("Error al obtener empresa:", error);
    return NextResponse.json(
      { error: "Error al obtener la empresa" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar una empresa
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id } = await params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "ID de compañía inválido" },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    // Construir objeto de datos
    const data: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      if (key === "companyLogo") {
        if (value instanceof File && value.size > 0) {
          const buffer = Buffer.from(await value.arrayBuffer());
          data.companyLogo = buffer.toString('base64');
        } else if (typeof value === 'string') {
          // Si el valor es un string, asumimos que es el base64 existente
          data.companyLogo = value;
        }
      } else if (key === "nda" && value instanceof File) {
        if (value.size > 0) {
          const buffer = Buffer.from(await value.arrayBuffer());
          data.nda = buffer;
          data.ndaFileName = value.name;
        }
      } else if (key === "stateId") {
        data.stateId = value ? parseInt(value.toString()) : null;
      } else if (key === "machineCount" || key === "employeeCount") {
        data[key] = value ? parseInt(value.toString()) : 0;
      } else {
        data[key] = value;
      }
    }

    // Validar los datos
    const validatedData = updateCompanySchema.parse(data);

    // Actualizar la empresa
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...validatedData,
        userId,
      },
    });

    return NextResponse.json({ items: [updatedCompany] });
  } catch (error) {
    console.error("Error in PUT /api/companies/[id]:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Error de validación", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar empresa" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una empresa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id } = await params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "ID de empresa inválido" },
        { status: 400 }
      );
    }

    await prisma.company.update({
      where: { id: companyId },
      data: { isDeleted: true, dateDeleted: new Date() },
    });

    return NextResponse.json({ items: [] });
  } catch (error) {
    console.error("Error in DELETE /api/companies/[id]:", error);
    return NextResponse.json(
      { error: "Error al eliminar empresa" },
      { status: 500 }
    );
  }
}
