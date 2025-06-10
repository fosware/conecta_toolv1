import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { companyCreateSchema } from "@/lib/schemas/company";
import { Prisma } from "@prisma/client";
import { handleRouteParams } from "@/lib/route-params";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el usuario y su rol
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Parámetros de búsqueda y paginación
    const searchQuery = request.nextUrl.searchParams.get("search") || "";
    const showActive = request.nextUrl.searchParams.get("showActive") === "true";
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10");
    
    // Calcular el offset para la paginación
    const skip = (page - 1) * limit;

    // Construir la condición where base
    let whereCondition: Prisma.CompanyWhereInput = {
      isDeleted: false,
    };

    // Añadir condición de activo si se solicita
    if (showActive) {
      whereCondition.isActive = true;
    }

    // Añadir condición de búsqueda si existe
    if (searchQuery) {
      whereCondition.OR = [
        { companyName: { contains: searchQuery, mode: 'insensitive' } },
        { comercialName: { contains: searchQuery, mode: 'insensitive' } },
        { contactName: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // Si el usuario es asociado o staff, solo puede ver las empresas a las que está asociado
    if (user.role.name.toLowerCase() === 'asociado' || user.role.name.toLowerCase() === 'staff') {
      // Obtener las empresas asociadas al usuario
      const userCompanies = await prisma.companyUser.findMany({
        where: {
          userId: userId,
          isActive: true,
          isDeleted: false,
        },
        select: {
          companyId: true,
        }
      });

      if (userCompanies.length === 0) {
        return NextResponse.json({ 
          success: true,
          data: [],
          total: 0,
          totalPages: 0,
          currentPage: page
        });
      }

      // Filtrar solo por las empresas del usuario
      whereCondition.id = {
        in: userCompanies.map(uc => uc.companyId)
      };
    }

    // Contar el total de registros para la paginación
    const totalCount = await prisma.company.count({
      where: whereCondition
    });
    
    // Calcular el total de páginas
    const totalPages = Math.ceil(totalCount / limit);
    
    // Ejecutar la consulta principal con paginación
    const companies = await prisma.company.findMany({
      where: whereCondition,
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
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: companies,
      total: totalCount,
      totalPages,
      currentPage: page
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
    console.error("[COMPANIES_GET_ACTIVE]", error);
    return NextResponse.json(
      { error: "Error al cargar empresas activas" },
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

    // Obtener el formulario
    const formData = await request.formData();

    // Procesar el archivo de logo si existe
    let companyLogo = undefined;
    const logoFile = formData.get("companyLogo") as File;
    if (logoFile && logoFile.size > 0) {
      const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
      companyLogo = logoBuffer.toString('base64'); // companyLogo es String? en Prisma
    }

    // Procesar el archivo NDA si existe
    let ndaBuffer = undefined;
    let ndaFileName = undefined;
    const ndaFile = formData.get("nda") as File;
    if (ndaFile && ndaFile.size > 0) {
      ndaBuffer = Buffer.from(await ndaFile.arrayBuffer()); // nda es Bytes? en Prisma, mantener como Buffer
      ndaFileName = formData.get("ndaFileName")
        ? (formData.get("ndaFileName") as string)
        : ndaFile.name;
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
      const result = await prisma.company.create({
        data: validationData,
      });

      return NextResponse.json({
        ...result,
        message: "Empresa creada exitosamente",
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
  } catch (error: unknown) {
    console.error("Error in POST /api/companies:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
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

    // Obtener el formulario
    const formData = await request.formData();

    // Procesar el logo de la empresa si existe
    let companyLogo = undefined;
    const logoFile = formData.get("companyLogo") as File;
    if (logoFile && logoFile.size > 0) {
      const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
      companyLogo = logoBuffer.toString('base64'); // companyLogo es String? en Prisma
    }

    // Procesar el archivo NDA si existe
    let ndaBuffer = undefined;
    let ndaFileName = undefined;
    const ndaFile = formData.get("nda") as File;
    if (ndaFile && ndaFile.size > 0) {
      ndaBuffer = Buffer.from(await ndaFile.arrayBuffer()); // nda es Bytes? en Prisma, mantener como Buffer
      ndaFileName = formData.get("ndaFileName")
          ? (formData.get("ndaFileName") as string)
          : ndaFile.name; // Usar el nombre del archivo si no se proporciona uno
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
