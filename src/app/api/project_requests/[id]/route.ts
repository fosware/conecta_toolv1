import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { projectRequestUpdateSchema } from "@/lib/schemas/project_request";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Extraer el ID correctamente
    const { id } = await params;

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
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

    const userRole = user.role.name.toLowerCase();

    // Construir la consulta base
    const baseQuery = {
      where: {
        id: parsedId,
        isDeleted: false,
        // Si el usuario es asociado, solo puede ver sus propias solicitudes
        ...(userRole === "asociado" ? { userId } : {}),
      },
      select: {
        id: true,
        title: true,
        requestDate: true,
        observation: true,
        statusId: true,
        isActive: true,
        isDeleted: true,
        dateDeleted: true,
        createdAt: true,
        updatedAt: true,
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
            username: true,
            email: true,
          },
        },
        // Incluir los requerimientos con su nombre, especialidades, certificaciones y participantes
        ProjectRequirements: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            requirementName: true,
            statusId: true,
            status: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            // Incluir especialidades asociadas al requerimiento
            RequirementSpecialty: {
              where: {
                isDeleted: false,
              },
              include: {
                specialty: true,
                scope: true,
                subscope: true,
              },
            },
            // Incluir certificaciones asociadas al requerimiento
            RequirementCertification: {
              where: {
                isDeleted: false,
              },
              include: {
                certification: true,
              },
            },
            // Incluir participantes (empresas) asociados al requerimiento
            ProjectRequestCompany: {
              where: {
                isDeleted: false,
              },
              include: {
                Company: {
                  select: {
                    id: true,
                    comercialName: true,
                    contactName: true,
                    email: true,
                    phone: true,
                  },
                },
                status: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          } as any,
        },
      },
    };

    const projectRequest = await prisma.projectRequest.findFirst(baseQuery);

    if (!projectRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: projectRequest,
    });
  } catch (error) {
    console.error("[PROJECT_REQUEST_GET]", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al cargar la solicitud de proyecto",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Acceder directamente a la propiedad id
    //const id = parseInt(params.id);
    const { id } = await params;

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Verificar que la solicitud existe
    const existingRequest = await prisma.projectRequest.findFirst({
      where: {
        id: parsedId,
        isDeleted: false,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
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

    const userRole = user.role.name.toLowerCase();

    // Si el usuario es asociado, solo puede editar sus propias solicitudes
    if (userRole === "asociado" && existingRequest.userId !== userId) {
      return NextResponse.json(
        { error: "No tienes permiso para editar esta solicitud" },
        { status: 403 }
      );
    }

    const body = await request.json();

    try {
      const validatedData = projectRequestUpdateSchema.parse(body);

      // Si se proporciona un clientAreaId, verificar que existe
      if (validatedData.clientAreaId) {
        const clientArea = await prisma.clientAreas.findUnique({
          where: { id: validatedData.clientAreaId },
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
      }

      // Actualizar la solicitud de proyecto
      const updatedProjectRequest = await prisma.projectRequest.update({
        where: { id: parsedId },
        data: {
          ...validatedData,
          updatedAt: new Date(),
        },
        include: {
          clientArea: {
            include: {
              client: true,
            },
          },
          user: true,
        },
      });

      return NextResponse.json({
        ...updatedProjectRequest,
        message: "Solicitud de proyecto actualizada exitosamente",
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
    console.error("Error in PUT /api/project_requests/[id]:", error);
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Extraer el ID correctamente
    const { id } = await params;

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Verificar que la solicitud existe
    const existingRequest = await prisma.projectRequest.findFirst({
      where: {
        id: parsedId,
        isDeleted: false,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
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

    const userRole = user.role.name.toLowerCase();

    // Si el usuario es asociado, solo puede editar sus propias solicitudes
    if (userRole === "asociado" && existingRequest.userId !== userId) {
      return NextResponse.json(
        { error: "No tienes permiso para editar esta solicitud" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "El campo isActive debe ser un booleano" },
        { status: 400 }
      );
    }

    // Actualizar solo el estado de activación
    const updatedProjectRequest = await prisma.projectRequest.update({
      where: { id: parsedId },
      data: {
        isActive,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedProjectRequest,
      message: `Solicitud de proyecto ${isActive ? "activada" : "desactivada"} exitosamente`,
    });
  } catch (error) {
    console.error("Error in PATCH /api/project_requests/[id]:", error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Acceder directamente a la propiedad id
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Verificar que la solicitud existe
    const existingRequest = await prisma.projectRequest.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
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

    const userRole = user.role.name.toLowerCase();

    // Si el usuario es asociado, solo puede eliminar sus propias solicitudes
    if (userRole === "asociado" && existingRequest.userId !== userId) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar esta solicitud" },
        { status: 403 }
      );
    }

    // Soft delete de la solicitud
    const deletedProjectRequest = await prisma.projectRequest.update({
      where: { id },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Solicitud de proyecto eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error in DELETE /api/project_requests/[id]:", error);
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
