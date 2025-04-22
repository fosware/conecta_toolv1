import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { projectRequestCreateSchema } from "@/lib/schemas/project_request";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const onlyActive = searchParams.get("onlyActive") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Obtener el usuario con su rol
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user || !user.role) {
      return NextResponse.json(
        { error: "Usuario no encontrado o sin rol asignado" },
        { status: 404 }
      );
    }

    const userRole = user.role.name.toLowerCase();

    // Construir la consulta base
    const baseQuery = {
      where: {
        AND: [
          {
            OR: [{ title: { contains: search, mode: "insensitive" as const } }],
          },
          onlyActive ? { isActive: true } : {},
          { isDeleted: false },
          // Si el usuario es asociado, solo mostrar sus solicitudes
          ...(userRole === "asociado" ? [{ userId }] : []),
        ] as any,
      },
      include: {
        clientArea: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        status: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" as const },
      skip,
      take: limit,
    };

    // Modificar la consulta para excluir el campo requestDate
    // Extraemos where, orderBy y take de baseQuery
    const { where, orderBy, take } = baseQuery;
    const skipValue = (page - 1) * limit;

    const [projectRequests, total] = await Promise.all([
      prisma.projectRequest.findMany({
        where,
        orderBy,
        skip: skipValue,
        take,
        select: {
          id: true,
          observation: true,
          title: true,
          isActive: true,
          isDeleted: true,
          createdAt: true,
          requestDate: true,
          updatedAt: true,
          dateDeleted: true,
          userId: true,
          clientAreaId: true,
          clientArea: {
            select: {
              id: true,
              areaName: true,
              contactName: true,
              contactEmail: true,
              contactPhone: true,
              clientId: true,
              client: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          status: {
            select: {
              id: true,
              name: true,
            },
          },
          ProjectRequirements: {
            where: {
              isDeleted: false,
            },
            select: {
              id: true,
              requirementName: true,
              isActive: true,
            },
          },
        },
      }),
      prisma.projectRequest.count({
        where: baseQuery.where,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      items: projectRequests,
      totalPages,
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("[PROJECT_REQUESTS_GET]", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al cargar solicitudes de proyectos",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el usuario con su rol
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user || !user.role) {
      return NextResponse.json(
        { error: "Usuario no encontrado o sin rol asignado" },
        { status: 404 }
      );
    }

    const body = await request.json();

    try {
      const validatedData = projectRequestCreateSchema.parse(body);

      // Verificar que el área del cliente existe
      const clientArea = await prisma.clientAreas.findUnique({
        where: { id: validatedData.clientAreaId },
        include: {
          client: true,
        },
      });

      if (!clientArea) {
        return NextResponse.json(
          {
            error: "El área del cliente no existe",
            type: "VALIDATION_ERROR",
            fields: [
              {
                field: "clientAreaId",
                message: "El área del cliente seleccionada no existe",
              },
            ],
          },
          { status: 400 }
        );
      }

      // Crear la solicitud de proyecto
      const projectRequest = await prisma.projectRequest.create({
        data: {
          ...validatedData,
          userId,
          statusId: 17, // Estado "Recibida"
          isActive: true,
          isDeleted: false,
        },
        select: {
          id: true,
          title: true,
          isActive: true,
          isDeleted: true,
          createdAt: true,
          requestDate: true,
          updatedAt: true,
          dateDeleted: true,
          userId: true,
          clientAreaId: true,
          clientArea: {
            select: {
              id: true,
              areaName: true,
              contactName: true,
              contactEmail: true,
              contactPhone: true,
              clientId: true,
              client: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          status: {
            select: {
              id: true,
              name: true,
            },
          },
          ProjectRequirements: {
            where: {
              isDeleted: false,
            },
            select: {
              id: true,
              requirementName: true,
              isActive: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: projectRequest,
        message: "Solicitud de proyecto creada exitosamente",
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Error de validación",
            type: "VALIDATION_ERROR",
            fields: error.issues.map((issue: z.ZodIssue) => ({
              field: issue.path[0],
              message: issue.message,
            })),
          },
          { status: 400 }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error("Error in POST /api/project_requests:", error);
    return NextResponse.json(
      {
        error:
          "Hubo un problema al procesar tu solicitud. Por favor, intenta nuevamente.",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
