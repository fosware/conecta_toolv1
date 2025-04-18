import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { handleRouteParams } from "@/lib/route-params";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extraer el ID correctamente
    const { id } = await params;
    const parsedId = parseInt(id);

    // Verificar autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token || !token.value) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el registro de ProjectRequestCompany
    const projectRequestCompany = await prisma.projectRequestCompany.findUnique(
      {
        where: {
          id: parsedId,
          isDeleted: false,
        },
      }
    );

    if (!projectRequestCompany) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      );
    }

    // Obtener la cotización
    const quotation = await prisma.projectRequestRequirementQuotation.findUnique(
      {
        where: {
          projectRequestCompanyId: parsedId,
          isDeleted: false,
          isActive: true,
        },
        select: {
          id: true,
          quotationFileName: true,
          createdAt: true,
          // No seleccionamos quotationFile para no cargar el archivo completo
        },
      }
    );

    if (!quotation) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ quotation });
  } catch (error) {
    console.error(
      "Error en GET /api/assigned_companies/[id]/quotation:",
      error
    );
    return NextResponse.json(
      { error: "Error al obtener la cotización" },
      { status: 500 }
    );
  }
}
