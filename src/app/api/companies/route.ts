import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { companyCreateSchema } from "@/lib/schemas/company";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const companies = await prisma.company.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        companyName: true,
        comercialName: true,
        contactName: true,
        email: true,
        phone: true,
        isActive: true,
        isDeleted: true,
        stateId: true,
        locationState: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        companyName: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error("[COMPANIES_GET]", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Error al cargar empresas" 
      },
      { status: 500 }
    );
  }
}

export async function GETActiveCompanies(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const companies = await prisma.company.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        companyName: true,
        comercialName: true,
        contactName: true,
        email: true,
        phone: true,
        isActive: true,
        isDeleted: true,
        stateId: true,
        locationState: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        companyName: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error("[COMPANIES_GET]", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Error al cargar empresas" 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el usuario con su rol
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        CompanyUser: true,
      },
    });

    if (!user || !user.role) {
      return NextResponse.json(
        { error: "Usuario no encontrado o sin rol asignado" },
        { status: 404 }
      );
    }

    const userRole = user.role.name.toLowerCase();

    // Si es Asociado, verificar que no tenga ya una empresa
    if (
      userRole === "asociado" &&
      user.CompanyUser &&
      user.CompanyUser.length > 0
    ) {
      return NextResponse.json(
        { error: "El usuario ya tiene una empresa asignada" },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    const logoFile = formData.get("companyLogo");
    let companyLogo = null;
    if (
      logoFile &&
      typeof logoFile === "object" &&
      "arrayBuffer" in logoFile &&
      typeof logoFile.arrayBuffer === "function"
    ) {
      const bytes = await logoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      companyLogo = buffer.toString("base64");
    }

    const ndaFile = formData.get("nda");
    let ndaBuffer: Uint8Array | null = null;
    let ndaFileName = formData.get("ndaFileName") as string | null;

    if (
      ndaFile &&
      typeof ndaFile === "object" &&
      "arrayBuffer" in ndaFile &&
      typeof ndaFile.arrayBuffer === "function"
    ) {
      const bytes = await ndaFile.arrayBuffer();
      ndaBuffer = new Uint8Array(bytes);
      ndaFileName =
        "name" in ndaFile
          ? (ndaFile.name as string)
          : (formData.get("ndaFileName") as string);
    }

    const validationData = {
      companyName: formData.get("companyName") as string,
      comercialName: formData.get("comercialName") as string,
      contactName: formData.get("contactName") as string,
      street: formData.get("street") as string,
      externalNumber: formData.get("externalNumber") as string,
      internalNumber: (formData.get("internalNumber") as string) || null,
      neighborhood: formData.get("neighborhood") as string,
      postalCode: formData.get("postalCode") as string,
      city: formData.get("city") as string,
      stateId: parseInt(formData.get("stateId") as string),
      phone: formData.get("phone") as string,
      website: (formData.get("website") as string) || null,
      email: formData.get("email") as string,
      machineCount: parseInt(formData.get("machineCount") as string) || 0,
      employeeCount: parseInt(formData.get("employeeCount") as string) || 0,
      shifts: (formData.get("shifts") as string) || null,
      achievementDescription:
        (formData.get("achievementDescription") as string) || null,
      profile: (formData.get("profile") as string) || null,
      shiftsProfileLink: (formData.get("shiftsProfileLink") as string) || null,
      companyLogo,
      nda: ndaBuffer ? Buffer.from(ndaBuffer) : null,
      ndaFileName,
      userId,
      isActive: true,
      isDeleted: false,
    };

    try {
      const validatedData = companyCreateSchema.parse(validationData);

      const existingCompany = await prisma.company.findFirst({
        where: {
          OR: [
            {
              companyName: {
                equals: validatedData.companyName,
                mode: "insensitive",
              },
            },
            {
              email: {
                equals: validatedData.email,
                mode: "insensitive",
              },
            },
          ],
          isDeleted: false,
        },
      });

      if (existingCompany) {
        return NextResponse.json(
          {
            error: "Ya existe una empresa con ese nombre o correo electrónico",
            type: "DUPLICATE_ENTRY",
          },
          { status: 400 }
        );
      }

      // Crear la empresa usando una transacción para asegurar consistencia
      const result = await prisma.$transaction(async (tx) => {
        // 1. Crear la empresa
        const company = await tx.company.create({
          data: {
            ...validatedData,
            nda: ndaBuffer ? Buffer.from(ndaBuffer) : null,
            ndaFileName: ndaFileName,
            companyLogo: companyLogo,
          },
        });

        // 2. Si el usuario es Asociado, crear la relación CompanyUser
        if (userRole === "asociado") {
          await tx.companyUser.create({
            data: {
              userId: userId,
              companyId: company.id,
              roleCompany: "ADMIN", // Rol dentro de la empresa
              isActive: true,
              isDeleted: false,
            },
          });
        }

        return company;
      });

      return NextResponse.json({
        ...result,
        message: "Empresa creada exitosamente",
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Error de validación",
            type: "VALIDATION_ERROR",
            fields: error.issues.map((issue: z.ZodIssue) => ({
              field: issue.path[0],
              message: issue.message,
            })),
          },
          { status: 400 }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error("Error in POST /api/companies:", error);
    return NextResponse.json(
      {
        error:
          "Hubo un problema al procesar tu solicitud. Por favor, intenta nuevamente.",
        details: error instanceof Error ? error.message : undefined,
      },
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
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();

    const logoFile = formData.get("companyLogo");
    let companyLogo = null;
    if (
      logoFile &&
      typeof logoFile === "object" &&
      "arrayBuffer" in logoFile &&
      typeof logoFile.arrayBuffer === "function"
    ) {
      const bytes = await logoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      companyLogo = buffer.toString("base64");
    }

    const ndaFile = formData.get("nda");
    let ndaBuffer: Uint8Array | null = null;
    let ndaFileName = formData.get("ndaFileName") as string | null;

    if (
      ndaFile &&
      typeof ndaFile === "object" &&
      "arrayBuffer" in ndaFile &&
      typeof ndaFile.arrayBuffer === "function"
    ) {
      const bytes = await ndaFile.arrayBuffer();
      ndaBuffer = new Uint8Array(bytes);
      ndaFileName =
        "name" in ndaFile
          ? (ndaFile.name as string)
          : (formData.get("ndaFileName") as string);
    }

    const validationData = {
      companyName: formData.get("companyName") as string,
      comercialName: formData.get("comercialName") as string,
      contactName: formData.get("contactName") as string,
      street: formData.get("street") as string,
      externalNumber: formData.get("externalNumber") as string,
      internalNumber: (formData.get("internalNumber") as string) || null,
      neighborhood: formData.get("neighborhood") as string,
      postalCode: formData.get("postalCode") as string,
      city: formData.get("city") as string,
      stateId: parseInt(formData.get("stateId") as string),
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      machineCount: parseInt(formData.get("machineCount") as string) || 0,
      employeeCount: parseInt(formData.get("employeeCount") as string) || 0,
      shifts: (formData.get("shifts") as string) || null,
      achievementDescription:
        (formData.get("achievementDescription") as string) || null,
      profile: formData.get("profile")?.toString() || undefined,
      shiftsProfileLink:
        formData.get("shiftsProfileLink")?.toString() || undefined,
      website: formData.get("website")?.toString() || undefined,
      companyLogo,
      nda: ndaBuffer || undefined,
      ndaFileName: ndaFileName || undefined,
      userId,
      isActive: true,
      isDeleted: false,
    };

    try {
      const validationResult = companyCreateSchema.parse(validationData);
    } catch (validationError) {
      return NextResponse.json(
        {
          error: "Error de validación",
          type: "VALIDATION_ERROR",
          fields: (validationError as z.ZodError).issues.map((issue) => ({
            field: issue.path[0],
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    try {
      const result = await prisma.company.update({
        where: { id: parseInt(params.id) },
        data: validationData,
      });

      return NextResponse.json({
        ...result,
        message: "Empresa actualizada exitosamente",
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return NextResponse.json(
            {
              error:
                "Ya existe una empresa con ese nombre o correo electrónico",
            },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: "Error al actualizar la empresa en la base de datos" },
          { status: 500 }
        );
      }

      // Error de validación de Zod
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "ZodError"
      ) {
        const zodError = error as import("zod").ZodError;
        return NextResponse.json(
          {
            error: "Error de validación",
            type: "VALIDATION_ERROR",
            fields: zodError.issues.map((issue) => ({
              field: issue.path[0],
              message: issue.message,
            })),
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Error in PUT /api/companies:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "");

    await prisma.company.update({
      where: { id },
      data: { isDeleted: true, dateDeleted: new Date() },
    });

    return NextResponse.json({ items: [] });
  } catch (error) {
    console.error("Error in DELETE /api/companies:", error);
    return NextResponse.json(
      { error: "Error al eliminar la empresa" },
      { status: 500 }
    );
  }
}
