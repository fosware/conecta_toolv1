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

    // Normalizar nombres de roles para comparación (insensible a mayúsculas/minúsculas)
    const roleName = user.role.name.toLowerCase();
    const isStaff = roleName === "staff";
    const isAsociado = roleName === "asociado";
    
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

    // Si es asociado o staff, verificar que tenga acceso a este proyecto
    if ((isAsociado || isStaff) && userCompanyId) {
      // Verificar si el proyecto pertenece a la compañía del usuario
      const projectAccess = await prisma.project.findFirst({
        where: {
          id: parsedId,
          ProjectRequestCompany: {
            companyId: userCompanyId,
          },
        },
      });

      if (!projectAccess) {
        return NextResponse.json({ error: "Acceso denegado a este proyecto" }, { status: 403 });
      }
    } else if ((isAsociado || isStaff) && !userCompanyId) {
      // Si es asociado o staff pero no tiene empresa asignada, denegar acceso
      return NextResponse.json({ error: "No tiene una empresa asignada" }, { status: 403 });
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
      // Crear un log con la fecha correcta usando una transacción con zona horaria explícita
      await prisma.$transaction(async (tx) => {
        // Establecemos explícitamente la zona horaria para esta transacción
        await tx.$executeRawUnsafe(`SET TIME ZONE 'America/Mexico_City';`);
        
        // Verificamos la fecha actual para depuración
        const checkDate = await tx.$queryRaw<{now: Date, now_tz: string}[]>`
          SELECT 
            NOW() as now,
            NOW()::text as now_tz
        `;
        // Se eliminaron los console.logs de fechas
        
        // Crear el log usando NOW() para asegurar que se use la zona horaria correcta
        await tx.projectLog.create({
          data: {
            projectId: parsedId,
            userId: userId,
            message: `Proyecto actualizado. Estado: ${projectStatusId ? 'Cambiado' : 'Sin cambios'}. Observaciones: ${observations ? 'Actualizadas' : 'Sin cambios'}.`,
            dateTimeMessage: checkDate[0].now, // Usamos la fecha del servidor con zona horaria correcta
          },
        });
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
      // Crear un log con la fecha correcta usando una transacción con zona horaria explícita
      await prisma.$transaction(async (tx) => {
        // Establecemos explícitamente la zona horaria para esta transacción
        await tx.$executeRawUnsafe(`SET TIME ZONE 'America/Mexico_City';`);
        
        // Verificamos la fecha actual para depuración
        const checkDate = await tx.$queryRaw<{now: Date, now_tz: string}[]>`
          SELECT 
            NOW() as now,
            NOW()::text as now_tz
        `;
        // Se eliminaron los console.logs de fechas
        
        // Crear el log usando NOW() para asegurar que se use la zona horaria correcta
        await tx.projectLog.create({
          data: {
            projectId: parsedId,
            userId: userId,
            message: "Proyecto eliminado.",
            dateTimeMessage: checkDate[0].now, // Usamos la fecha del servidor con zona horaria correcta
          },
        });
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
