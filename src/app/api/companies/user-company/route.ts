import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener la empresa del usuario a través de CompanyUser
    const userCompany = await prisma.companyUser.findFirst({
      where: { 
        userId: userId,
        isActive: true,
        isDeleted: false
      },
      include: { 
        company: {
          select: {
            id: true,
            companyName: true,
            comercialName: true,
          }
        }
      }
    });

    if (!userCompany?.company) {
      return NextResponse.json({
        success: false,
        message: "Usuario no tiene empresa asignada"
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      company: userCompany.company
    });
  } catch (error) {
    console.error("[USER_COMPANY_GET]", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Error al obtener empresa del usuario" 
      },
      { status: 500 }
    );
  }
}
