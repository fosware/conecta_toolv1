import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente según las mejores prácticas de Next.js 15
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
        }
      }
    );

    if (!quotation) {
      // En lugar de devolver un error 404, devolvemos una respuesta exitosa
      // indicando que no hay cotización disponible
      return NextResponse.json({
        available: false,
        message: "No hay cotización disponible"
      });
    }

    // Devolver la información de la cotización
    return NextResponse.json({
      available: true,
      id: quotation.id,
      quotationFileName: quotation.quotationFileName,
      createdAt: quotation.createdAt,
    });
  } catch (error) {
    console.error("Error al obtener información de la cotización:", error);
    return NextResponse.json(
      { error: "Error al obtener información de la cotización" },
      { status: 500 }
    );
  }
}
