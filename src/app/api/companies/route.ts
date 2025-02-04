import { prisma } from "../../../lib/prisma";
import { getUserFromToken } from "../../../lib/get-user-from-token";
import { NextRequest, NextResponse } from "next/server";
import { companyCreateSchema } from "../../../lib/schemas/company";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showActive = searchParams.get("showActive") === "true";
    const search = searchParams.get("search") || "";

    const companies = await prisma.company.findMany({
      where: {
        isDeleted: false,
        ...(showActive && { isActive: true }),
        ...(search && {
          OR: [
            { companyName: { contains: search, mode: 'insensitive' } },
            { contactName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
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
    const formData = await request.formData();

    const logoFile = formData.get("companyLogo") as File | null;
    let companyLogo = null;
    if (logoFile && logoFile instanceof File && logoFile.size > 0) {
      const bytes = await logoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      companyLogo = buffer.toString('base64');
    }

    const ndaFile = formData.get("nda") as File | null;
    let ndaBuffer: Uint8Array | null = null;
    let ndaFileName = formData.get("ndaFileName") as string | null;
    
    if (ndaFile && ndaFile instanceof File && ndaFile.size > 0) {
      const bytes = await ndaFile.arrayBuffer();
      ndaBuffer = new Uint8Array(bytes);
      ndaFileName = ndaFile.name;
    }

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
      machineCount: parseInt(formData.get("machineCount") as string) || 0,
      employeeCount: parseInt(formData.get("employeeCount") as string) || 0,
      shifts: formData.get("shifts") as string || "",
      achievementDescription: formData.get("achievementDescription") as string || null,
      profile: formData.get("profile") as string || null,
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
                mode: 'insensitive',
              },
            },
            {
              email: {
                equals: validatedData.email,
                mode: 'insensitive',
              },
            }
          ],
          isDeleted: false,
        },
        select: {
          companyName: true,
          email: true,
        }
      });

      if (existingCompany) {
        const isDuplicateEmail = existingCompany.email.toLowerCase() === validatedData.email.toLowerCase();
        const isDuplicateName = existingCompany.companyName.toLowerCase() === validatedData.companyName.toLowerCase();
        
        let errorMessage = "Ya existe una empresa con ";
        if (isDuplicateEmail && isDuplicateName) {
          errorMessage += "este nombre y correo electrónico";
        } else if (isDuplicateEmail) {
          errorMessage += "este correo electrónico";
        } else {
          errorMessage += "este nombre";
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        );
      }

      const company = await prisma.company.create({
        data: {
          ...validatedData,
          nda: ndaBuffer ? Buffer.from(ndaBuffer) : null,
          ndaFileName: ndaFileName,
          companyLogo: companyLogo,
        },
      });

      return NextResponse.json(company);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': {
            const field = error.meta?.target as string[];
            const fieldName = {
              'email': 'correo electrónico',
              'companyName': 'nombre de empresa'
            }[field[0]] || field[0];
            
            return NextResponse.json(
              { error: `Ya existe una empresa con este ${fieldName}` },
              { status: 400 }
            );
          }
          case 'P2003':
            return NextResponse.json(
              { error: "El estado seleccionado no es válido" },
              { status: 400 }
            );
          case 'P2025':
            return NextResponse.json(
              { error: "No se encontró el registro relacionado" },
              { status: 400 }
            );
          default:
            console.error("Prisma error:", error);
            return NextResponse.json(
              { error: "Error al procesar la solicitud. Por favor, intenta de nuevo." },
              { status: 500 }
            );
        }
      }
      
      if (error instanceof Error) {
        try {
          const zodError = JSON.parse(error.message);
          return NextResponse.json(
            { 
              error: "Error de validación", 
              details: zodError.map((err: any) => ({
                field: err.path.join('.'),
                message: err.message
              }))
            }, 
            { status: 400 }
          );
        } catch {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          );
        }
      }

      console.error("Error in POST /api/companies:", error);
      return NextResponse.json(
        { error: "Error al crear la empresa. Por favor, intenta de nuevo." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/companies:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear la empresa" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const id = parseInt(formData.get("id") as string);

    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    const logoFile = formData.get("companyLogo") as File | null;
    let companyLogo = undefined;
    if (logoFile && logoFile instanceof File) {
      const bytes = await logoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      companyLogo = buffer.toString('base64');
    }

    const ndaFile = formData.get("nda") as File | null;
    let ndaBuffer = undefined;
    let ndaFileName = undefined;
    
    if (ndaFile && ndaFile instanceof File) {
      const bytes = await ndaFile.arrayBuffer();
      ndaBuffer = new Uint8Array(bytes);
      ndaFileName = ndaFile.name;
    }

    const updateData: Prisma.CompanyUpdateInput = {
      companyName: formData.get("companyName") as string,
      contactName: formData.get("contactName") as string,
      street: formData.get("street") as string,
      externalNumber: formData.get("externalNumber") as string,
      internalNumber: formData.get("internalNumber") as string || null,
      neighborhood: formData.get("neighborhood") as string,
      postalCode: formData.get("postalCode") as string,
      city: formData.get("city") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      machineCount: parseInt(formData.get("machineCount") as string) || 0,
      employeeCount: parseInt(formData.get("employeeCount") as string) || 0,
      shifts: formData.get("shifts") as string || null,
      achievementDescription: formData.get("achievementDescription") as string || null,
      profile: formData.get("profile") as string || null,
      locationState: {
        connect: {
          id: parseInt(formData.get("stateId") as string)
        }
      }
    };

    if (companyLogo !== undefined) {
      updateData.companyLogo = companyLogo;
    }
    if (ndaBuffer !== undefined) {
      updateData.nda = ndaBuffer;
      updateData.ndaFileName = ndaFileName;
    }

    const company = await prisma.company.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ items: [company] });
  } catch (error) {
    console.error("Error in PUT /api/companies:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al actualizar la empresa" },
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
