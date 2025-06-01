import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { ProjectRequestLogsService } from "@/lib/services/project-request-logs";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente según las mejores prácticas de Next.js
    const { id } = await params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    // Obtener la solicitud de proyecto
    const projectRequest = await prisma.projectRequest.findUnique({
      where: { id: parsedId },
    });

    if (!projectRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    // Encontrar todos los requerimientos para este proyecto
    const requirements = await prisma.projectRequirements.findMany({
      where: {
        projectRequestId: parsedId,
        isActive: true,
        isDeleted: false,
      },
    });

    const requirementIds = requirements.map(req => req.id);

    // Actualizar el estado de la solicitud a "Proyecto Autorizado"
    const projectAuthorizedStatus = await prisma.statusProjectRequest.findFirst({
      where: {
        name: "Proyecto Autorizado",
      },
    });

    if (!projectAuthorizedStatus) {
      return NextResponse.json(
        { error: "Estado 'Proyecto Autorizado' no encontrado" },
        { status: 404 }
      );
    }

    // Obtener el estado "Por Iniciar" para los nuevos proyectos
    const initialProjectStatus = await prisma.projectStatus.findFirst({
      where: {
        name: "Por Iniciar",
      },
    });

    if (!initialProjectStatus) {
      return NextResponse.json(
        { error: "Estado 'Por Iniciar' para proyectos no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar el estado de la solicitud a "Proyecto Autorizado"
    await prisma.projectRequest.update({
      where: { id: parsedId },
      data: {
        statusId: projectAuthorizedStatus.id,
      },
    });

    // Obtener las compañías asociadas que YA tienen cotización aprobada por el cliente (statusId 14)
    // No cambiamos su estado, solo obtenemos las que ya están aprobadas
    const approvedCompanies = await prisma.projectRequestCompany.findMany({
      where: {
        projectRequirementsId: {
          in: requirementIds,
        },
        statusId: 14, // Cotización aprobada por el cliente
        isActive: true,
        isDeleted: false,
      },
      include: {
        Company: true,
      },
    });

    // Array para almacenar los proyectos creados
    const createdProjects = [];
    
    // Crear un proyecto para cada asociado con cotización aprobada
    for (const company of approvedCompanies) {
      // Verificar si ya existe un proyecto para este asociado y esta solicitud
      const existingProject = await prisma.project.findFirst({
        where: {
          projectRequestId: parsedId,
          projectRequestCompanyId: company.id,
        },
      });

      // Si no existe, crear un nuevo proyecto
      if (!existingProject) {
        const newProject = await prisma.project.create({
          data: {
            projectRequestId: parsedId,
            projectStatusId: initialProjectStatus.id,
            projectRequestCompanyId: company.id,
            userId: company.userId, // Usar el userId del asociado
          },
        });
        
        createdProjects.push(newProject);

        // Crear log para notificación al asociado
        await ProjectRequestLogsService.createLog({
          projectRequestCompanyId: company.id,
          message: `El proyecto "${projectRequest.title}" ha sido aprobado. Revisa la sección de Proyectos.`,
          userId: userId,
          isSystemMessage: true,
        });
      }
    }

    return NextResponse.json({
      message: "Proyecto aprobado correctamente",
      createdProjects: createdProjects.length,
    });
  } catch (error) {
    console.error("Error al aprobar el proyecto:", error);
    return NextResponse.json(
      { error: "Error al aprobar el proyecto" },
      { status: 500 }
    );
  }
}
