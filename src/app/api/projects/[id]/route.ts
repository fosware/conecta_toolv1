import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

// GET para obtener un proyecto específico
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente
    const params = await context.params;
    const { id } = params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "ID de proyecto inválido" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el rol del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const isStaff = user.role.name === "staff";
    const isAsociado = user.role.name === "asociado";

    // Construir la consulta base
    let query: any = {
      where: {
        id: parsedId,
      },
      include: {
        user: true,
        ProjectStatus: true,
        ProjectRequestCompany: {
          include: {
            Company: true,
          },
        },
        ProjectLog: {
          orderBy: {
            createdAt: "desc" as const,
          },
          include: {
            user: true,
          },
        },
        ProjectCategory: {
          include: {
            Category: true,
          },
        },
      },
    };

    // Si es asociado, verificar que tenga acceso a este proyecto
    if (isAsociado) {
      // Obtener la compañía del asociado
      const associatedCompany = await prisma.company.findFirst({
        where: {
          userId: userId,
          isActive: true,
          isDeleted: false,
        },
      });

      if (!associatedCompany) {
        return NextResponse.json({ error: "Compañía no encontrada" }, { status: 404 });
      }

      // Verificar si el proyecto pertenece a la compañía del asociado
      const projectAccess = await prisma.project.findFirst({
        where: {
          id: parsedId,
          ProjectRequestCompany: {
            Company: {
              id: associatedCompany.id,
            },
          },
        },
      });

      if (!projectAccess) {
        return NextResponse.json({ error: "Acceso denegado a este proyecto" }, { status: 403 });
      }
    }

    // Ejecutar la consulta
    const project = await prisma.project.findUnique(query);

    if (!project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error al obtener proyecto:", error);
    return NextResponse.json(
      { error: "Error al obtener proyecto" },
      { status: 500 }
    );
  }
}

// PUT para actualizar un proyecto
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente
    const params = await context.params;
    const { id } = params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "ID de proyecto inválido" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el rol del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const isStaff = user.role.name === "staff";
    
    // Solo el staff puede actualizar proyectos
    if (!isStaff) {
      return NextResponse.json(
        { error: "No tiene permisos para actualizar proyectos" },
        { status: 403 }
      );
    }

    // Verificar si el proyecto existe
    const existingProject = await prisma.project.findUnique({
      where: { id: parsedId },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Obtener los datos del cuerpo de la solicitud
    const requestData = await request.json();
    
    // Validar los datos recibidos
    if (!requestData) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    // Extraer los campos a actualizar
    const { projectStatusId, observations } = requestData;

    // Actualizar el proyecto
    const updatedProject = await prisma.project.update({
      where: { id: parsedId },
      data: {
        projectStatusId: projectStatusId || undefined,
        observations: observations || undefined,
        updatedAt: new Date(),
      },
    });

    // Crear un log de la actualización
    if (updatedProject) {
      await prisma.projectLog.create({
        data: {
          projectId: parsedId,
          userId: userId,
          message: `Proyecto actualizado. Estado: ${projectStatusId ? 'Cambiado' : 'Sin cambios'}. Observaciones: ${observations ? 'Actualizadas' : 'Sin cambios'}.`,
        },
      });
    }

    return NextResponse.json({
      message: "Proyecto actualizado correctamente",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error al actualizar proyecto:", error);
    return NextResponse.json(
      { error: "Error al actualizar proyecto" },
      { status: 500 }
    );
  }
}

// DELETE para marcar un proyecto como eliminado
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente
    const params = await context.params;
    const { id } = params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "ID de proyecto inválido" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el rol del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const isStaff = user.role.name === "staff";
    
    // Solo el staff puede eliminar proyectos
    if (!isStaff) {
      return NextResponse.json(
        { error: "No tiene permisos para eliminar proyectos" },
        { status: 403 }
      );
    }

    // Verificar si el proyecto existe
    const existingProject = await prisma.project.findUnique({
      where: { id: parsedId },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Marcar el proyecto como eliminado
    const deletedProject = await prisma.project.update({
      where: { id: parsedId },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
      },
    });

    // Crear un log de la eliminación
    if (deletedProject) {
      await prisma.projectLog.create({
        data: {
          projectId: parsedId,
          userId: userId,
          message: "Proyecto eliminado.",
        },
      });
    }

    return NextResponse.json({
      message: "Proyecto eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar proyecto:", error);
    return NextResponse.json(
      { error: "Error al eliminar proyecto" },
      { status: 500 }
    );
  }
}
