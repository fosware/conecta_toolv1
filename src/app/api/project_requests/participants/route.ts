import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "@/lib/auth";
import { ProjectRequestLogsService } from "@/lib/services/project-request-logs";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function POST(request: NextRequest) {
  try {
    // En una aplicación real, aquí verificaríamos la autenticación
    // Para simplificar, asumimos que el usuario está autenticado
    const userId = await getUserFromToken();

    // Procesar el formulario multipart
    const formData = await request.formData();
    const projectRequestId = parseInt(formData.get("projectRequestId") as string);
    const selectedCompaniesJson = formData.get("selectedCompanies") as string;
    const selectedCompanies = JSON.parse(selectedCompaniesJson) as number[];

    if (isNaN(projectRequestId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Verificar que la solicitud existe
    const projectRequest = await prisma.projectRequest.findUnique({
      where: { id: projectRequestId },
    });

    if (!projectRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    // Obtener las empresas que ya son participantes usando SQL raw
    const existingParticipants = await prisma.$queryRaw`
      SELECT "companyId"
      FROM d_project_request_companies
      WHERE "projectRequestId" = ${projectRequestId}
      AND "isDeleted" = false
    `;
    
    const existingParticipantIds = (existingParticipants as any[]).map(p => p.companyId);

    // Empresas a eliminar (estaban antes pero ya no están seleccionadas)
    const companiesToRemove = existingParticipantIds.filter(
      (id) => !selectedCompanies.includes(id)
    );

    // Empresas a añadir (están seleccionadas pero no estaban antes)
    const companiesToAdd = selectedCompanies.filter(
      (id) => !existingParticipantIds.includes(id)
    );

    // Marcar como eliminadas las empresas que ya no están seleccionadas
    if (companiesToRemove.length > 0) {
      for (const companyId of companiesToRemove) {
        await prisma.$executeRaw`
          UPDATE d_project_request_companies
          SET "isDeleted" = true, "dateDeleted" = NOW()
          WHERE "projectRequestId" = ${projectRequestId}
          AND "companyId" = ${companyId}
        `;
      }
    }

    // Añadir nuevas empresas seleccionadas
    const uploadPromises = companiesToAdd.map(async (companyId) => {
      const ndaFile = formData.get(`nda_${companyId}`) as File | null;
      let ndaFileBuffer = null;
      let ndaFileName = null;

      if (ndaFile) {
        try {
          // Obtener el contenido del archivo como Buffer
          ndaFileBuffer = Buffer.from(await ndaFile.arrayBuffer());
          ndaFileName = ndaFile.name;
        } catch (error) {
          console.error("Error al procesar el archivo NDA:", error);
        }
      }

      // Determinar el estatus según si se ha subido un NDA o no
      const statusId = ndaFileBuffer ? 3 : 2; // 2=Asociado seleccionado, 3=En espera de firma NDA

      // Crear el registro en la base de datos usando SQL raw
      return prisma.$executeRaw`
        INSERT INTO d_project_request_companies 
        ("projectRequestId", "companyId", "ndaFile", "ndaFileName", "statusId", "userId", "isActive", "isDeleted", "createdAt", "updatedAt")
        VALUES 
        (${projectRequestId}, ${companyId}, ${ndaFileBuffer}, ${ndaFileName}, ${statusId}, ${userId}, true, false, NOW(), NOW())
      `;
    });

    // Actualizar archivos NDA para empresas existentes
    const existingCompaniesPromises = existingParticipantIds
      .filter((id: number) => selectedCompanies.includes(id))
      .map(async (companyId: number) => {
        const ndaFile = formData.get(`nda_${companyId}`) as File | null;
        
        if (!ndaFile) {
          return null; // No hay cambios en el archivo NDA
        }

        try {
          // Obtener el contenido del archivo como Buffer
          const ndaFileBuffer = Buffer.from(await ndaFile.arrayBuffer());
          const ndaFileName = ndaFile.name;

          // Determinar el estatus según si se ha subido un NDA o no
          const statusId = ndaFileBuffer ? 3 : 2; // 2=Asociado seleccionado, 3=En espera de firma NDA

          // Actualizar el registro en la base de datos usando SQL raw
          return prisma.$executeRaw`
            UPDATE d_project_request_companies
            SET "ndaFile" = ${ndaFileBuffer}, "ndaFileName" = ${ndaFileName}, "statusId" = ${statusId}, "updatedAt" = NOW()
            WHERE "projectRequestId" = ${projectRequestId}
            AND "companyId" = ${companyId}
            AND "isDeleted" = false
          `;
        } catch (error) {
          console.error("Error al actualizar el archivo NDA:", error);
          return null;
        }
      });

    // Esperar a que todas las operaciones se completen
    await Promise.all([...uploadPromises, ...existingCompaniesPromises]);

    // Crear logs del sistema para cada empresa añadida
    for (const companyId of companiesToAdd) {
      // Obtener la relación proyecto-compañía recién creada
      const projectCompany = await prisma.projectRequestCompany.findFirst({
        where: {
          projectRequestId: projectRequestId,
          companyId: companyId,
          isDeleted: false
        }
      });
      
      if (projectCompany) {
        // Crear log para asociado seleccionado
        await ProjectRequestLogsService.createSystemLog(
          projectCompany.id,
          "ASSOCIATE_SELECTED",
          userId
        );
        
        // Si se subió un NDA, crear log adicional
        const ndaFile = formData.get(`nda_${companyId}`) as File | null;
        if (ndaFile) {
          await ProjectRequestLogsService.createSystemLog(
            projectCompany.id,
            "NDA_SENT",
            userId
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al guardar participantes:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
