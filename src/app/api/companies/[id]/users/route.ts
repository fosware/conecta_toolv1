import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    const { id } = await params;

    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Verificar si el asociado existe
    const company = await prisma.company.findUnique({
      where: { id: idNumber, isDeleted: false },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            username: true,
            isActive: true,
            profile: {
              select: {
                name: true,
                first_lastname: true,
                second_lastname: true,
                phone: true,
                image_profile: true,
              },
            },
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Asociado no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(company.users ? company.users : []);
  } catch (error) {
    console.error("Error fetching associate users:", error);
    return NextResponse.json(
      { error: "Error al obtener los usuarios del asociado" },
      { status: 500 }
    );
  }
}
