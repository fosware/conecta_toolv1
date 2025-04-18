import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { handleRouteParams } from "@/lib/route-params";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; requirementId: string } }
) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    
    // Obtener los IDs de la URL siguiendo las mejores prácticas de Next.js 15
    const { id, requirementId } = await params;
    const projectRequestId = parseInt(id);
    const projectRequirementId = parseInt(requirementId);
    
    if (isNaN(projectRequestId) || isNaN(projectRequirementId)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Obtener el proyecto para saber el cliente
    const projectRequest = await prisma.projectRequest.findUnique({
      where: {
        id: projectRequestId,
        isDeleted: false,
      },
      include: {
        clientArea: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!projectRequest || !projectRequest.clientArea || !projectRequest.clientArea.client) {
      return NextResponse.json(
        { error: "Proyecto no encontrado o sin cliente asociado" },
        { status: 404 }
      );
    }

    const clientId = projectRequest.clientArea.client.id;

    // Verificar que exista el requerimiento y pertenezca a la solicitud
    const requirement = await prisma.projectRequirements.findFirst({
      where: {
        id: projectRequirementId,
        projectRequestId: projectRequestId,
        isDeleted: false,
      },
    });

    if (!requirement) {
      return NextResponse.json(
        { error: "Requerimiento no encontrado" },
        { status: 404 }
      );
    }

    // Obtener las especialidades requeridas por el requerimiento
    const requirementSpecialties = await prisma.requirementSpecialty.findMany({
      where: {
        projectRequirementsId: projectRequirementId,
        isDeleted: false,
      },
      include: {
        specialty: true,
      },
    });

    // Obtener las certificaciones requeridas por el requerimiento
    const requirementCertifications = await prisma.requirementCertification.findMany({
      where: {
        projectRequirementsId: projectRequirementId,
        isDeleted: false,
      },
      include: {
        certification: true,
      },
    });

    // Obtener las empresas ya asociadas al requerimiento
    const requirementCompanies = await prisma.projectRequestCompany.findMany({
      where: {
        projectRequirementsId: projectRequirementId,
        isDeleted: false,
      }
    });

    // Obtener todos los NDAs para este cliente
    const ndas = await prisma.clientCompanyNDA.findMany({
      where: {
        clientId: clientId,
        isDeleted: false,
        isActive: true,
      }
    });

    // Obtener todas las empresas activas
    const companies = await prisma.company.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        comercialName: true,
        contactName: true,
        email: true,
        phone: true,
      },
    });

    // Obtener las especialidades de las empresas
    const companySpecialties = await prisma.companySpecialties.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        company: {
          select: {
            id: true,
            isActive: true,
          },
        },
        specialty: true,
        scope: true,
        subscope: true,
      },
    });

    // Obtener las certificaciones de las empresas
    const companyCertifications = await prisma.companyCertifications.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        company: {
          select: {
            id: true,
            isActive: true,
          },
        },
        certification: true,
      },
    });

    // Para cada empresa, verificar si cumple con los requisitos
    const eligibleCompanies = await Promise.all(companies.map(async (company) => {
      // Filtrar las especialidades de esta empresa
      const companySpecialtiesFiltered = companySpecialties.filter(
        (cs) => cs.companyId === company.id && cs.company.isActive
      );

      // Filtrar las certificaciones de esta empresa
      const companyCertificationsFiltered = companyCertifications.filter(
        (cc) => cc.companyId === company.id && cc.company.isActive
      );

      // Verificar especialidades coincidentes
      const matchingSpecialties = requirementSpecialties.filter((reqSpecialty) => {
        return companySpecialtiesFiltered.some(
          (companySpecialty) => {
            // Verificar coincidencia de especialidad
            const specialtyMatch = companySpecialty.specialtyId === reqSpecialty.specialtyId;
            
            // Si hay scope, verificar coincidencia
            const scopeMatch = !reqSpecialty.scopeId || 
              (reqSpecialty.scopeId && companySpecialty.scopeId === reqSpecialty.scopeId);
            
            // Si hay subscope, verificar coincidencia
            const subscopeMatch = !reqSpecialty.subscopeId || 
              (reqSpecialty.subscopeId && companySpecialty.subscopeId === reqSpecialty.subscopeId);
            
            return specialtyMatch && scopeMatch && subscopeMatch;
          }
        );
      });

      // Verificar certificaciones coincidentes
      const matchingCertifications = requirementCertifications.filter((reqCert) => {
        return companyCertificationsFiltered.some(
          (companyCert) => companyCert.certificationId === reqCert.certificationId
        );
      });

      // Verificar si la empresa ya es participante
      const existingParticipant = requirementCompanies.find(
        (rc) => rc.companyId === company.id
      );

      // Verificar si existe un NDA entre el cliente y la empresa
      const nda = ndas.find(n => n.companyId === company.id);
      
      // Construir información del NDA
      const ndaInfo = {
        hasNDA: !!nda,
        ndaId: nda?.id || null,
        ndaFileName: nda?.ndaSignedFileName || null,
        ndaExpirationDate: nda?.ndaExpirationDate || null
      };

      // Construir objeto de respuesta
      return {
        ...company,
        matchingSpecialties: matchingSpecialties.length,
        matchingCertifications: matchingCertifications.length,
        isParticipant: !!existingParticipant,
        participantId: existingParticipant?.id || null,
        hasNDA: ndaInfo.hasNDA,
        ndaId: ndaInfo.ndaId,
        ndaFileName: ndaInfo.ndaFileName,
        ndaExpirationDate: ndaInfo.ndaExpirationDate,
        statusId: existingParticipant?.statusId || null,
      };
    }));

    return NextResponse.json({
      companies: eligibleCompanies,
      totalSpecialties: requirementSpecialties.length,
      totalCertifications: requirementCertifications.length,
    });
  } catch (error) {
    console.error("Error al obtener empresas elegibles:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
