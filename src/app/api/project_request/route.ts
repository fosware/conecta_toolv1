import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { projectRequestFormSchema } from "@/lib/schemas/project-request";

// GET: Obtener todas las solicitudes de proyecto
export async function GET(req: NextRequest) {
  try {
    // Obtener el usuario desde el token
    const userId = await getUserFromToken().catch(error => {
      console.error("Error al obtener el usuario desde el token:", error);
      return null;
    });

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log("Usuario autenticado:", userId);

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const showActive = url.searchParams.get("showActive") === "true";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Construir la consulta con los filtros
    const where: any = {};
    
    // Filtrar por estado activo si showActive es true
    if (showActive) {
      where.isActive = true;
    }
    
    // Filtrar por término de búsqueda
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { clientArea: { areaName: { contains: search, mode: "insensitive" } } },
        { clientArea: { client: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    // Obtener el total de registros para la paginación
    const total = await prisma.projectRequest.count({ where });

    // Obtener los registros con paginación
    const items = await prisma.projectRequest.findMany({
      where,
      include: {
        clientArea: {
          include: {
            client: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      items,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error en GET /api/project_request:", error);
    return NextResponse.json(
      { error: "Error al obtener las solicitudes de proyecto" },
      { status: 500 }
    );
  }
}

// POST: Crear una nueva solicitud de proyecto
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();

    // Validar los datos con Zod
    const validationResult = projectRequestFormSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { title, clientAreaId, details } = validationResult.data;

    // Crear la solicitud de proyecto en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear la solicitud principal
      const projectRequest = await tx.projectRequest.create({
        data: {
          title,
          clientAreaId,
          userId,
        },
      });

      // 2. Crear los detalles de la solicitud
      for (const detail of details) {
        const projectDetail = await tx.projectRequestDetails.create({
          data: {
            name: detail.name,
            projectRequestId: projectRequest.id,
            userId,
          },
        });

        // 3. Crear las certificaciones asociadas
        if (detail.certifications && detail.certifications.length > 0) {
          for (const cert of detail.certifications) {
            await tx.requirementCertification.create({
              data: {
                projectDetailsId: projectDetail.id,
                certificationId: cert,
                userId,
              },
            });
          }
        }

        // 4. Crear las especialidades asociadas
        if (detail.specialties && detail.specialties.length > 0) {
          for (const spec of detail.specialties) {
            await tx.requirementSpecialty.create({
              data: {
                projectDetailsId: projectDetail.id,
                specialtyId: spec,
                scopeId: detail.scopeId || null,
                subscopeId: detail.subscopeId || null,
                userId,
              },
            });
          }
        }
      }

      return projectRequest;
    });

    return NextResponse.json(
      { mensaje: "Solicitud creada correctamente", data: result },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear solicitud:", error);
    return NextResponse.json(
      { error: "Error al crear la solicitud de proyecto" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar una solicitud de proyecto
export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere el ID de la solicitud" },
        { status: 400 }
      );
    }

    // Validar que la solicitud existe
    const existingRequest = await prisma.projectRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "La solicitud no existe" },
        { status: 404 }
      );
    }

    // Actualizar la solicitud
    const updatedRequest = await prisma.projectRequest.update({
      where: { id },
      data: {
        title: data.title,
        clientAreaId: data.clientAreaId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      mensaje: "Solicitud actualizada correctamente",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error al actualizar solicitud:", error);
    return NextResponse.json(
      { error: "Error al actualizar la solicitud de proyecto" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una solicitud de proyecto (soft delete)
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere el ID de la solicitud" },
        { status: 400 }
      );
    }

    // Validar que la solicitud existe
    const existingRequest = await prisma.projectRequest.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "La solicitud no existe" },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.projectRequest.update({
      where: { id: parseInt(id) },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
      },
    });

    return NextResponse.json({
      mensaje: "Solicitud eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar solicitud:", error);
    return NextResponse.json(
      { error: "Error al eliminar la solicitud de proyecto" },
      { status: 500 }
    );
  }
}
