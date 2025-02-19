import { prisma } from "../../../lib/prisma";
import { getUserFromToken } from "../../../lib/get-user-from-token";
import { NextRequest, NextResponse } from "next/server";
import { companyCreateSchema } from "../../../lib/schemas/company";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el usuario con su rol y companyUser
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

    const { searchParams } = new URL(request.url);
    const showActive = searchParams.get("showActive") === "true";
    const search = searchParams.get("search") || "";

    const baseWhere: Prisma.CompanyWhereInput = {
      isDeleted: false,
      ...(showActive && { isActive: true }),
      ...(search && {
        OR: [
          {
            companyName: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            contactName: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
    };

    const baseSelect = {
      id: true,
      companyName: true,
      comercialName: true,
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
          name: true,
        },
      },
      companyLogo: true,
      nda: false,
      ndaFileName: true,
      isActive: true,
      achievementDescription: true,
      profile: true,
      userId: true,
      stateId: true,
      website: true,
      shiftsProfileLink: true,
    } satisfies Prisma.CompanySelect;

    const userRole = user.role.name.toLowerCase();

    // Si es Staff o Asociado, verificar si tiene empresa asignada
    if (userRole === "staff" || userRole === "asociado") {
      // Si no tiene empresa asignada, retornar lista vacía
      if (!user.CompanyUser || user.CompanyUser.length === 0) {
        return NextResponse.json({ items: [] });
      }

      // Obtener solo la empresa asignada
      const assignedCompany = await prisma.company.findFirst({
        where: {
          ...baseWhere,
          id: user.CompanyUser[0].companyId,
        },
        select: baseSelect,
      });

      return NextResponse.json({
        items: assignedCompany ? [assignedCompany] : [],
      });
    }

    // Si es Admin, obtener todas las empresas
    const companies = await prisma.company.findMany({
      where: baseWhere,
      select: baseSelect,
      orderBy: {
        companyName: "asc",
      },
    });

    return NextResponse.json({ items: companies });
  } catch (error) {
    console.error("Error in GET /api/companies:", error);
    return NextResponse.json(
      { error: "Error al obtener las empresas" },
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
      shifts: (formData.get("shifts") as string) || "",
      achievementDescription:
        (formData.get("achievementDescription") as string) || null,
      profile: (formData.get("profile") as string) || null,
      shiftsProfileLink: (formData.get("shiftsProfileLink") as string) || null,
      companyLogo,
      nda: ndaBuffer,
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
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return NextResponse.json(
          { error: "Error al crear la empresa en la base de datos" },
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
    let companyLogo = undefined;
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
    let ndaBuffer = undefined;
    let ndaFileName = undefined;

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

    const updateData: Prisma.CompanyUpdateInput = {
      companyName: formData.get("companyName") as string,
      comercialName: formData.get("comercialName") as string,
      contactName: formData.get("contactName") as string,
      street: formData.get("street") as string,
      externalNumber: formData.get("externalNumber") as string,
      internalNumber: (formData.get("internalNumber") as string) || null,
      neighborhood: formData.get("neighborhood") as string,
      postalCode: formData.get("postalCode") as string,
      city: formData.get("city") as string,
      phone: formData.get("phone") as string,
      website: (formData.get("website") as string) || null,
      email: formData.get("email") as string,
      machineCount: parseInt(formData.get("machineCount") as string) || 0,
      employeeCount: parseInt(formData.get("employeeCount") as string) || 0,
      shifts: (formData.get("shifts") as string) || "",
      achievementDescription:
        (formData.get("achievementDescription") as string) || null,
      profile: (formData.get("profile") as string) || null,
      shiftsProfileLink: (formData.get("shiftsProfileLink") as string) || null,
      locationState: {
        connect: {
          id: parseInt(formData.get("stateId") as string),
        },
      },
      ...(companyLogo && { companyLogo }),
      ...(ndaBuffer && { nda: ndaBuffer }),
      ...(ndaFileName && { ndaFileName }),
      ...(formData.has("isActive") && { 
        isActive: formData.get("isActive") === "true" 
      }),
    };

    // Validate the data
    try {
      const validationResult = companyCreateSchema.parse({
        ...updateData,
        stateId: parseInt(formData.get("stateId") as string),
      });
    } catch (validationError) {
      return NextResponse.json(
        {
          error: "Error de validación",
          type: "VALIDATION_ERROR",
          details: (validationError as import("zod").ZodError).issues.map(
            (issue) => ({
              field: issue.path[0],
              message: issue.message,
            })
          ),
        },
        { status: 400 }
      );
    }

    try {
      const result = await prisma.company.update({
        where: { id: parseInt(params.id) },
        data: updateData,
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
