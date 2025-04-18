import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { z } from "zod";

const updateCompanySchema = z.object({
  companyName: z.string().optional(),
  comercialName: z.string().optional(),
  contactName: z.string().optional(),
  street: z.string().optional(),
  externalNumber: z.string().optional(),
  internalNumber: z.string().optional(),
  neighborhood: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  stateId: z.coerce.number().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  email: z.string().email().optional(),
  machineCount: z.coerce.number().optional(),
  employeeCount: z.coerce.number().optional(),
  shifts: z.string().optional(),
  companyLogo: z.string().nullable().optional(),
  nda: z.any().nullable().optional(),
  ndaFileName: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  profile: z.string().nullable().optional(),
  shiftsProfileLink: z.string().nullable().optional(),
  achievementDescription: z.string().nullable().optional(),
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
            name: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: company });
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
    const data: Record<string, any> = {
      companyName: formData.get("companyName") as string,
      comercialName: formData.get("comercialName") as string,
      contactName: formData.get("contactName") as string,
      street: formData.get("street") as string,
      externalNumber: formData.get("externalNumber") as string,
      internalNumber: formData.get("internalNumber") as string,
      neighborhood: formData.get("neighborhood") as string,
      postalCode: formData.get("postalCode") as string,
      city: formData.get("city") as string,
      stateId: formData.get("stateId")
        ? parseInt(formData.get("stateId") as string)
        : null,
      phone: formData.get("phone") as string,
      profile: (formData.get("profile") as string) || null,
      shiftsProfileLink: (formData.get("shiftsProfileLink") as string) || null,
      website: (formData.get("website") as string) || null,
      email: formData.get("email") as string,
      machineCount: formData.get("machineCount")
        ? parseInt(formData.get("machineCount") as string)
        : 0,
      employeeCount: formData.get("employeeCount")
        ? parseInt(formData.get("employeeCount") as string)
        : 0,
      shifts: formData.get("shifts") as string,
      achievementDescription: formData.get("achievementDescription") as string,
    };

    // Manejar archivos por separado
    const companyLogoFile = formData.get("companyLogo");
    const ndaFile = formData.get("nda");

    if (
      companyLogoFile &&
      typeof companyLogoFile === "object" &&
      "arrayBuffer" in companyLogoFile &&
      typeof companyLogoFile.arrayBuffer === "function"
    ) {
      const bytes = await companyLogoFile.arrayBuffer();
      data.companyLogo = Buffer.from(bytes).toString("base64");
    } else if (typeof companyLogoFile === "string") {
      data.companyLogo = companyLogoFile;
    }

    if (
      ndaFile &&
      typeof ndaFile === "object" &&
      "arrayBuffer" in ndaFile &&
      typeof ndaFile.arrayBuffer === "function"
    ) {
      const bytes = await ndaFile.arrayBuffer();
      data.nda = Buffer.from(bytes);
      data.ndaFileName =
        "name" in ndaFile
          ? ndaFile.name
          : (formData.get("ndaFileName") as string);
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

    return NextResponse.json({ data: updatedCompany });
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
