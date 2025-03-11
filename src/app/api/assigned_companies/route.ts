import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    // const session = await getServerSession(authOptions);
    if (false) { // Autenticación deshabilitada temporalmente
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const onlyActive = searchParams.get("onlyActive") === "true";
    
    // En un entorno real, filtraríamos por la compañía del usuario asociado
    // Por ahora, para desarrollo, mostraremos todas las asignaciones
    const companyId = parseInt(searchParams.get("companyId") || "0");

    // Construir el filtro base
    const baseFilter: any = {
      isDeleted: false,
    };

    // Aplicar filtro de activo si es necesario
    if (onlyActive) {
      baseFilter.isActive = true;
    }

    // Aplicar filtro de compañía si se proporciona
    if (companyId > 0) {
      baseFilter.companyId = companyId;
    }

    // Obtener las solicitudes asignadas
    const items = await prisma.projectRequestCompany.findMany({
      where: baseFilter,
      include: {
        ProjectRequest: {
          include: {
            clientArea: {
              include: {
                client: true,
              },
            },
          },
        },
        Company: true,
        status: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error en GET /api/assigned_companies:", error);
    return NextResponse.json(
      { error: "Error al obtener las solicitudes asignadas" },
      { status: 500 }
    );
  }
}
