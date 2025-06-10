import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { projectRequestUpdateSchema } from "@/lib/schemas/project_request";
import { handleRouteParams } from "@/lib/route-params";

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
    const isAsociado = userRole === "asociado";
    const isStaff = userRole === "staff";

    // Obtener la compañía del usuario si es Asociado o Staff
    let userCompanyId = null;
    if (isAsociado || isStaff) {
      const companyUser = await prisma.companyUser.findFirst({
        where: {
          userId: userId,
          isActive: true,
          isDeleted: false,
        },
        include: {
          company: true
        }
      });
      
      if (companyUser && companyUser.company) {
        userCompanyId = companyUser.company.id;
      }
    }

    // Si es asociado o staff, verificar que tenga acceso a esta solicitud
    if ((isAsociado || isStaff) && userCompanyId) {
      // Verificar si la empresa del usuario participa en esta solicitud
      const hasAccess = await prisma.projectRequest.findFirst({
        where: {
          id: parsedId,
          ProjectRequirements: {
            some: {
              ProjectRequestCompany: {
                some: {
                  companyId: userCompanyId,
                  isDeleted: false
                }
              }
            }
          }
        }
      });

      if (!hasAccess) {
        return NextResponse.json({ error: "Acceso denegado a esta solicitud de proyecto" }, { status: 403 });
      }
    } else if ((isAsociado || isStaff) && !userCompanyId) {
      // Si es asociado o staff pero no tiene empresa asignada, denegar acceso
      return NextResponse.json({ error: "No tiene una empresa asignada" }, { status: 403 });
    }

    // Construir la consulta base simplificada y compatible con los tipos de Prisma
    const baseQuery = {
      where: {
        id: parsedId,
        isDeleted: false,
      },
      include: {
        status: true,
        clientArea: {
          include: {
            client: true,
          },
        },
        user: true,
        ProjectRequirements: {
          where: {
            isDeleted: false,
          },
          include: {
            status: true,
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
            RequirementCertification: {
              where: {
                isDeleted: false,
              },
              include: {
                certification: true,
              },
            },
            ProjectRequestCompany: {
              where: {
                isDeleted: false,
                // Aplicamos el filtro de companyId solo si tenemos un valor definido
                ...(isAsociado || isStaff ? userCompanyId ? { companyId: userCompanyId } : {} : {}),
              },
              include: {
                Company: true,
                status: true,
              },
              orderBy: {
                createdAt: "asc" as const,
              },
            },
          },
          orderBy: {
            priority: 'asc' as const,
          },
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
    const isAsociado = userRole === "asociado";
    const isStaff = userRole === "staff";

    // Si es asociado o staff, no permitir actualizar solicitudes
    if (isAsociado || isStaff) {
      return NextResponse.json(
        { error: "No tiene permisos para actualizar solicitudes de proyecto" },
        { status: 403 }
      );
    }

    // Verificar que la solicitud existe
    const existingRequest = await prisma.projectRequest.findUnique({
      where: { id: parsedId },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json();

    try {
      const validatedData = projectRequestUpdateSchema.parse(body);

      // Verificar que el área del cliente existe si se proporciona
      if (validatedData.clientAreaId) {
        const clientArea = await prisma.clientAreas.findUnique({
          where: { id: validatedData.clientAreaId },
        });

        if (!clientArea) {
          return NextResponse.json(
            { error: "El área del cliente no existe" },
            { status: 404 }
          );
        }
      }

      // Actualizar la solicitud de proyecto
      const updatedProjectRequest = await prisma.projectRequest.update({
        where: { id: parsedId },
        data: {
          title: validatedData.title,
          observation: validatedData.observation,
          clientAreaId: validatedData.clientAreaId,
          // No actualizamos statusId ya que no está en el esquema de validación
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedProjectRequest,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: "Datos inválidos",
            details: error.errors,
          },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("[PROJECT_REQUEST_PUT]", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar la solicitud de proyecto",
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
    const isAsociado = userRole === "asociado";
    const isStaff = userRole === "staff";

    // Si es asociado o staff, no permitir actualizar solicitudes
    if (isAsociado || isStaff) {
      return NextResponse.json(
        { error: "No tiene permisos para actualizar solicitudes de proyecto" },
        { status: 403 }
      );
    }

    // Verificar que la solicitud existe
    const existingRequest = await prisma.projectRequest.findUnique({
      where: { id: parsedId },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Actualizar solo los campos proporcionados
    const updatedProjectRequest = await prisma.projectRequest.update({
      where: { id: parsedId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.observation !== undefined && { observation: body.observation }),
        ...(body.clientAreaId !== undefined && {
          clientAreaId: body.clientAreaId,
        }),
        ...(body.statusId !== undefined && { statusId: body.statusId }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedProjectRequest,
    });
  } catch (error) {
    console.error("[PROJECT_REQUEST_PATCH]", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar la solicitud de proyecto",
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
    const isAsociado = userRole === "asociado";
    const isStaff = userRole === "staff";

    // Si es asociado o staff, no permitir eliminar solicitudes
    if (isAsociado || isStaff) {
      return NextResponse.json(
        { error: "No tiene permisos para eliminar solicitudes de proyecto" },
        { status: 403 }
      );
    }

    // Verificar que la solicitud existe
    const existingRequest = await prisma.projectRequest.findUnique({
      where: { id: parsedId },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    // Realizar borrado lógico
    await prisma.projectRequest.update({
      where: { id: parsedId },
      data: {
        isDeleted: true,
        isActive: false,
        dateDeleted: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Solicitud de proyecto eliminada correctamente",
    });
  } catch (error) {
    console.error("[PROJECT_REQUEST_DELETE]", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al eliminar la solicitud de proyecto",
      },
      { status: 500 }
    );
  }
}
