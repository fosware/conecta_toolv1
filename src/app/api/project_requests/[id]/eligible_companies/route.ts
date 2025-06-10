import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "@/lib/auth";
import { handleRouteParams } from "@/lib/route-params";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar token (opcional)
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      // Se eliminó el log de depuración de token
    }

    // Obtener el ID de la solicitud de la URL de forma correcta
    const { id } = await params;
    const projectRequestId = parseInt(id);
    if (isNaN(projectRequestId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    // Obtener los requisitos de especialidades de la solicitud
    const projectRequestSpecialties = await prisma.$queryRaw`
      SELECT prs.id, prs."specialtyId", prs."scopeId", prs."subscopeId" as "subScopeId" 
      FROM d_project_request_specialties prs 
      WHERE prs."projectRequestId" = ${projectRequestId} AND prs."isDeleted" = false
    `;

    // Obtener los requisitos de certificaciones de la solicitud
    const projectRequestCertifications = await prisma.$queryRaw`
      SELECT prc.id, prc."certificationId"
      FROM d_project_request_certifications prc 
      WHERE prc."projectRequestId" = ${projectRequestId} AND prc."isDeleted" = false
    `;

    // Obtener las empresas ya asociadas a la solicitud
    const projectRequestCompanies = await prisma.$queryRaw`
      SELECT prc.id, prc."companyId", prc."ndaFile", prc."ndaFileName", prc."ndaSignedFile", prc."ndaSignedFileName", prc."statusId"
      FROM d_project_request_companies prc 
      WHERE prc."projectRequestId" = ${projectRequestId} AND prc."isDeleted" = false
    `;

    // Verificar que exista la solicitud de proyecto
    const projectRequest = await prisma.projectRequest.findUnique({
      where: { id: projectRequestId },
    });

    if (!projectRequest) {
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    // Obtener todas las empresas activas
    const companies = await prisma.$queryRaw`
      SELECT 
        id, 
        "comercialName", 
        "contactName", 
        email, 
        phone
      FROM d_companies
      WHERE "isActive" = true AND "isDeleted" = false
    `;

    // Obtener las especialidades de las empresas
    const companySpecialties = await prisma.$queryRaw`
      SELECT cs."companyId", cs."specialtyId", cs."scopeId", cs."subscopeId" as "subScopeId"
      FROM r_company_specialties cs
      JOIN d_companies c ON cs."companyId" = c.id
      WHERE c."isActive" = true AND cs."isDeleted" = false
    `;

    // Obtener las certificaciones de las empresas
    const companyCertifications = await prisma.$queryRaw`
      SELECT cc."companyId", cc."certificationId"
      FROM r_company_certifications cc
      JOIN d_companies c ON cc."companyId" = c.id
      WHERE c."isActive" = true AND cc."isDeleted" = false
    `;

    // Para cada empresa, verificar si cumple con los requisitos
    const eligibleCompanies = (companies as any[]).map((company: any) => {
      // Filtrar las especialidades de esta empresa
      const companySpecialtiesFiltered = (companySpecialties as any[]).filter(
        (cs: any) => cs.companyId === company.id
      );

      // Filtrar las certificaciones de esta empresa
      const companyCertificationsFiltered = (
        companyCertifications as any[]
      ).filter((cc: any) => cc.companyId === company.id);

      // Verificar especialidades coincidentes
      const matchingSpecialties = (projectRequestSpecialties as any[]).filter(
        (reqSpecialty) => {
          return companySpecialtiesFiltered.some(
            (companySpecialty) =>
              companySpecialty.specialtyId === reqSpecialty.specialtyId &&
              (!reqSpecialty.scopeId ||
                companySpecialty.scopeId === reqSpecialty.scopeId) &&
              (!reqSpecialty.subScopeId ||
                companySpecialty.subScopeId === reqSpecialty.subScopeId)
          );
        }
      ).length;

      // Verificar certificaciones coincidentes
      const matchingCertifications = (
        projectRequestCertifications as any[]
      ).filter((reqCertification) => {
        return companyCertificationsFiltered.some(
          (companyCertification) =>
            companyCertification.certificationId ===
            reqCertification.certificationId
        );
      }).length;

      // Verificar si la empresa ya es participante en esta solicitud
      const existingParticipant = (projectRequestCompanies as any[]).find(
        (prc) => prc.companyId === company.id
      );

      return {
        id: company.id,
        comercialName: company.comercialName,
        contactName: company.contactName,
        email: company.email,
        phone: company.phone,
        matchingSpecialties,
        matchingCertifications,
        isParticipant: !!existingParticipant,
        hasNDA: existingParticipant?.ndaFile ? true : false,
        ndaFile: existingParticipant?.ndaFile,
        ndaFileName: existingParticipant?.ndaFileName,
        hasSignedNDA: existingParticipant?.ndaSignedFile ? true : false,
        ndaSignedFileName: existingParticipant?.ndaSignedFileName,
        statusId: existingParticipant?.statusId || null,
        participantId: existingParticipant?.id || null,
      };
    });

    // Ordenar las empresas por número de coincidencias (de mayor a menor)
    eligibleCompanies.sort((a: any, b: any) => {
      const totalMatchesA = a.matchingSpecialties + a.matchingCertifications;
      const totalMatchesB = b.matchingSpecialties + b.matchingCertifications;
      return totalMatchesB - totalMatchesA;
    });

    return NextResponse.json({ companies: eligibleCompanies });
  } catch (error) {
    console.error("Error al obtener empresas elegibles:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
