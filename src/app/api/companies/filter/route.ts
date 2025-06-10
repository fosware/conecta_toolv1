import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const specialtyId = searchParams.get("specialtyId");
    const scopeId = searchParams.get("scopeId");
    const subscopeId = searchParams.get("subscopeId");
    const certificationIds = searchParams.getAll("certificationIds[]");

    /*
    // Se eliminaron los logs de filtros recibidos
    /*
      specialtyId,
      scopeId,
      subscopeId,
      certificationIds,
    }); // Debug
  */
    const where: Prisma.CompanyWhereInput = {
      isActive: true,
      isDeleted: false,
    };

    // Agregar filtro de especialidades si se especificó
    if (specialtyId) {
      where.CompanySpecialties = {
        some: {
          specialtyId: parseInt(specialtyId),
          isActive: true,
          isDeleted: false,
          ...(scopeId && {
            scopeId: parseInt(scopeId),
            ...(subscopeId && {
              subscopeId: parseInt(subscopeId),
            }),
          }),
        },
      };
    }

    // Agregar filtro de certificaciones si se especificaron
    if (certificationIds.length > 0) {
      where.CompanyCertifications = {
        some: {
          certificationId: {
            in: certificationIds.map((id) => parseInt(id)),
          },
          isActive: true,
          isDeleted: false,
          isCommitment: false, // Solo certificaciones reales, no compromisos
        },
      };
    }

    // Validar que se haya especificado al menos un filtro
    if (!specialtyId && certificationIds.length === 0) {
      return NextResponse.json(
        { error: "Se requiere al menos una especialidad o certificación" },
        { status: 400 }
      );
    }

    // console.log("Query Prisma:", JSON.stringify(where, null, 2)); // Debug

    const companies = await prisma.company.findMany({
      where,
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

    //console.log("Empresas encontradas:", companies.length); // Debug

    return NextResponse.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error("Error al filtrar empresas:", error);
    return NextResponse.json(
      { error: "Error al filtrar empresas" },
      { status: 500 }
    );
  }
}
