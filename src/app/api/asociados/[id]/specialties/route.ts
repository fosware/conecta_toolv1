import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

type AssociateSpecialty = {
  id: number;
  specialtyId: number;
  scopeId: number | null;
  subscopeId: number | null;
  materials: string | null;
  specialty: {
    name: string;
  };
  scope: {
    name: string;
  } | null;
  subscope: {
    name: string;
  } | null;
};

// GET: Obtener especialidades de un asociado
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id } = await params;
    const associateId = parseInt(id);

    if (isNaN(associateId)) {
      return NextResponse.json(
        { error: "ID de asociado inválido" },
        { status: 400 }
      );
    }

    // Primero verificar si el asociado existe
    const associate = await prisma.associate.findFirst({
      where: {
        id: associateId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!associate) {
      return NextResponse.json(
        { error: "Asociado no encontrado" },
        { status: 404 }
      );
    }

    const specialties = await prisma.associateSpecialties.findMany({
      where: {
        associateId,
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        specialtyId: true,
        scopeId: true,
        subscopeId: true,
        materials: true,
        specialty: {
          select: {
            name: true,
          },
        },
        scope: {
          select: {
            name: true,
          },
        },
        subscope: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transformar los resultados para manejar null
    const transformedSpecialties = specialties.map((spec: AssociateSpecialty) => ({
      ...spec,
      scope: spec.scope || null,
      subscope: spec.subscope || null,
    }));

    return NextResponse.json({ items: transformedSpecialties });
  } catch (error) {
    console.error("Error al obtener especialidades:", error);
    return NextResponse.json(
      { error: "Error al obtener las especialidades" },
      { status: 500 }
    );
  }
}

// POST: Agregar una nueva especialidad a un asociado
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const { id } = await params;
    const associateId = parseInt(id);
    const data = await request.json();

    const { specialtyId, scopeId, subscopeId, materials } = data;

    if (!specialtyId) {
      return NextResponse.json(
        { error: "La especialidad es requerida" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una especialidad activa con la misma combinación
    const existingSpecialty = await prisma.associateSpecialties.findFirst({
      where: {
        associateId,
        specialtyId,
        scopeId: scopeId || null,
        subscopeId: subscopeId || null,
        isActive: true,
        isDeleted: false,
      },
    });

    if (existingSpecialty) {
      return NextResponse.json(
        { error: "Ya existe una especialidad activa con la misma combinación" },
        { status: 400 }
      );
    }

    // Crear la especialidad
    const newSpecialty = await prisma.associateSpecialties.create({
      data: {
        associateId,
        specialtyId,
        scopeId: scopeId || null,
        subscopeId: subscopeId || null,
        materials,
        userId,
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        specialtyId: true,
        scopeId: true,
        subscopeId: true,
        materials: true,
        specialty: {
          select: {
            name: true,
          },
        },
        scope: {
          select: {
            name: true,
          },
        },
        subscope: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Especialidad creada correctamente",
      specialty: newSpecialty,
    });
  } catch (error) {
    console.error("Error al crear especialidad:", error);
    return NextResponse.json(
      { error: "Error al crear la especialidad" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una especialidad de un asociado
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    const searchParams = new URL(request.url).searchParams;
    const specialtyId = searchParams.get("specialtyId");

    if (!specialtyId) {
      return NextResponse.json(
        { error: "ID de especialidad no proporcionado" },
        { status: 400 }
      );
    }

    // Verificar que la especialidad exista y pertenezca al asociado
    const specialty = await prisma.associateSpecialties.findFirst({
      where: {
        id: parseInt(specialtyId),
        associateId: parseInt(params.id),
        isDeleted: false,
      },
    });

    if (!specialty) {
      return NextResponse.json(
        { error: "Especialidad no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar lógicamente la especialidad
    await prisma.associateSpecialties.update({
      where: {
        id: parseInt(specialtyId),
      },
      data: {
        isDeleted: true,
        isActive: false,
        dateDeleted: new Date(),
      },
    });

    return NextResponse.json({
      message: "Especialidad eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar especialidad:", error);
    return NextResponse.json(
      { error: "Error al eliminar la especialidad" },
      { status: 500 }
    );
  }
}
