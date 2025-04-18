import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { ProjectRequestLogsService } from "@/lib/services/project-request-logs";
import { handleRouteParams } from "@/lib/route-params";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener el ID de la empresa asignada siguiendo las mejores prácticas de Next.js 15
    const routeParams = handleRouteParams(params);
const { id  } = routeParams;
    const assignedCompanyId = parseInt(id);

    if (isNaN(assignedCompanyId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Buscar la empresa asignada
    const assignedCompany = await prisma.projectRequestCompany.findUnique({
      where: {
        id: assignedCompanyId,
        isDeleted: false,
      },
      include: {
        Company: true,
        ProjectRequirements: {
          include: {
            ProjectRequest: {
              include: {
                clientArea: {
                  include: {
                    client: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!assignedCompany) {
      return NextResponse.json(
        { error: "Empresa asignada no encontrada" },
        { status: 404 }
      );
    }

    // Obtener el cliente asociado a esta solicitud de proyecto
    const clientId = assignedCompany.ProjectRequirements?.ProjectRequest?.clientArea?.client?.id;

    if (!clientId) {
      return NextResponse.json(
        { error: "No se pudo determinar el cliente asociado" },
        { status: 400 }
      );
    }

    // Obtener el archivo del formulario
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Leer el archivo como un ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Buscar si ya existe un NDA asociado a esta compañía y cliente
    const existingNDA = await prisma.clientCompanyNDA.findFirst({
      where: {
        clientId: clientId,
        companyId: assignedCompany.companyId,
        isDeleted: false
      }
    });
    
    let ndaId: number;
    
    if (existingNDA) {
      // Actualizar el NDA existente
      const updatedNDA = await prisma.clientCompanyNDA.update({
        where: {
          id: existingNDA.id
        },
        data: {
          ndaSignedFile: buffer,
          ndaSignedFileName: file.name,
          ndaExpirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año desde ahora
          isActive: true
        }
      });
      ndaId = updatedNDA.id;
    } else {
      // Crear un nuevo NDA
      const newNDA = await prisma.clientCompanyNDA.create({
        data: {
          clientId: clientId,
          companyId: assignedCompany.companyId,
          userId: userId,
          ndaSignedFile: buffer,
          ndaSignedFileName: file.name,
          ndaExpirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año desde ahora
          isActive: true,
          isDeleted: false
        }
      });
      ndaId = newNDA.id;
    }

    // Actualizar el registro de la empresa asignada con el estado de NDA
    await prisma.projectRequestCompany.update({
      where: {
        id: assignedCompanyId,
      },
      data: {
        statusId: 3, // "En espera de firma NDA"
      },
    });

    // Crear un log automático del sistema
    await ProjectRequestLogsService.createSystemLog(
      assignedCompanyId,
      "NDA_SIGNED",
      userId
    );

    return NextResponse.json({
      success: true,
      message: "NDA firmado subido correctamente",
    });
  } catch (error) {
    console.error("Error en POST /api/assigned_companies/[id]/upload-nda:", error);
    return NextResponse.json(
      { error: "Error al subir el NDA firmado" },
      { status: 500 }
    );
  }
}
