import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { type CompanySpecialty } from "@/types";
import { handleRouteParams } from "@/lib/route-params";

// GET: Obtener especialidades de una empresa
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const paramsValue = await params;
    const routeParams = await handleRouteParams(params);
    const { id  } = routeParams;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID de empresa inválido",
        },
        { status: 400 }
      );
    }

    // Primero verificar si la empresa existe
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!company) {
      return NextResponse.json(
        {
          success: false,
          error: "Empresa no encontrada",
        },
        { status: 404 }
      );
    }

    const specialties = await prisma.companySpecialties.findMany({
      where: {
        companyId,
        isActive: true,
        isDeleted: false,
      },
      include: {
        specialty: true,
        scope: true,
        subscope: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: specialties,
    });
  } catch (error) {
    console.error("Error al obtener especialidades:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al procesar la solicitud. Por favor, inténtelo de nuevo.",
      },
      {
        status: 500,
      }
    );
  }
}

// POST: Agregar una nueva especialidad a una empresa
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id } = await params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID de empresa inválido",
        },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "El cuerpo de la solicitud es inválido",
        },
        { status: 400 }
      );
    }

    const { specialtyId, scopeId, subscopeId, materials, machineCapacity } =
      body;

    if (!specialtyId) {
      return NextResponse.json(
        {
          success: false,
          error: "La especialidad es requerida",
        },
        { status: 400 }
      );
    }

    // Verificar si ya existe la especialidad para esta empresa
    const existingSpecialty = await prisma.companySpecialties.findFirst({
      where: {
        companyId,
        specialtyId: parseInt(specialtyId),
        scopeId: scopeId ? parseInt(scopeId) : null,
        subscopeId: subscopeId ? parseInt(subscopeId) : null,
        isDeleted: false,
      },
    });

    if (existingSpecialty) {
      return NextResponse.json(
        {
          success: false,
          error: "Esta especialidad ya está registrada para esta empresa",
        },
        { status: 400 }
      );
    }

    // Verificar si existe una versión eliminada y reactivarla
    const deletedSpecialty = await prisma.companySpecialties.findFirst({
      where: {
        companyId,
        specialtyId: parseInt(specialtyId),
        scopeId: scopeId ? parseInt(scopeId) : null,
        subscopeId: subscopeId ? parseInt(subscopeId) : null,
        isDeleted: true,
      },
    });

    if (deletedSpecialty) {
      // Reactivar la especialidad eliminada
      const reactivated = await prisma.companySpecialties.update({
        where: {
          id: deletedSpecialty.id,
        },
        data: {
          isActive: true,
          isDeleted: false,
          materials: materials || "",
          machineCapacity: machineCapacity || "",
          userId,
        },
      });

      return NextResponse.json({
        success: true,
        data: reactivated,
        message: "Especialidad reactivada correctamente",
      });
    }

    // Si no existe, crear nueva
    const specialty = await prisma.companySpecialties.create({
      data: {
        companyId,
        specialtyId: parseInt(specialtyId),
        scopeId: scopeId ? parseInt(scopeId) : null,
        subscopeId: subscopeId ? parseInt(subscopeId) : null,
        materials: materials || "",
        machineCapacity: machineCapacity || "",
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: specialty,
      message: "Especialidad agregada correctamente",
    });
  } catch (error) {
    console.error("Error al agregar especialidad:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al procesar la solicitud. Por favor, inténtelo de nuevo.",
      },
      {
        status: 500,
      }
    );
  }
}

// DELETE: Eliminar una especialidad
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const paramsValue = await params;
    const routeParams = await handleRouteParams(params);
    const { id  } = routeParams;
    const specialtyId = parseInt(id);

    if (isNaN(specialtyId)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID de especialidad inválido",
        },
        { status: 400 }
      );
    }

    // Verificar si la especialidad existe
    const specialty = await prisma.companySpecialties.findFirst({
      where: {
        id: specialtyId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!specialty) {
      return NextResponse.json(
        {
          success: false,
          error: "Especialidad no encontrada",
        },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.companySpecialties.update({
      where: {
        id: specialtyId,
      },
      data: {
        isActive: false,
        isDeleted: true,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Especialidad eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar especialidad:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al procesar la solicitud. Por favor, inténtelo de nuevo.",
      },
      {
        status: 500,
      }
    );
  }
}
