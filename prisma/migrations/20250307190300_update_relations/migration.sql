/*
  Warnings:

  - You are about to drop the `d_project_quotes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `d_project_request_details` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `d_project_request_details_certifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `d_project_request_details_companies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `d_project_request_details_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `d_project_request_details_ndas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `d_project_request_details_quotations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `d_project_request_details_specialties` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `d_projects` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "d_project_quotes" DROP CONSTRAINT "d_project_quotes_companyId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_quotes" DROP CONSTRAINT "d_project_quotes_projectId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_quotes" DROP CONSTRAINT "d_project_quotes_userId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_details" DROP CONSTRAINT "d_project_request_details_projectRequestId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_details" DROP CONSTRAINT "d_project_request_details_userId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_details_certifications" DROP CONSTRAINT "d_project_request_details_certifications_projectDetailsId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_details_certifications" DROP CONSTRAINT "d_project_request_details_certifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_details_companies" DROP CONSTRAINT "d_project_request_details_companies_companyId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_details_companies" DROP CONSTRAINT "d_project_request_details_companies_projectRequestDetailId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_details_companies" DROP CONSTRAINT "d_project_request_details_companies_userId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_details_documents" DROP CONSTRAINT "d_project_request_details_documents_projectRequestDetailCo_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_details_documents" DROP CONSTRAINT "d_project_request_details_documents_userId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_details_ndas" DROP CONSTRAINT "d_project_request_details_ndas_projectRequestDetailCompani_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_details_ndas" DROP CONSTRAINT "d_project_request_details_ndas_userId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_details_quotations" DROP CONSTRAINT "d_project_request_details_quotations_projectRequestDetailC_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_details_quotations" DROP CONSTRAINT "d_project_request_details_quotations_userId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_details_specialties" DROP CONSTRAINT "d_project_request_details_specialties_projectDetailsId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_details_specialties" DROP CONSTRAINT "d_project_request_details_specialties_userId_fkey";

-- DropForeignKey
ALTER TABLE "d_projects" DROP CONSTRAINT "d_projects_clientAreaId_fkey";

-- DropForeignKey
ALTER TABLE "d_projects" DROP CONSTRAINT "d_projects_clientId_fkey";

-- DropForeignKey
ALTER TABLE "d_projects" DROP CONSTRAINT "d_projects_projectTypeId_fkey";

-- DropForeignKey
ALTER TABLE "d_projects" DROP CONSTRAINT "d_projects_userId_fkey";

-- AlterTable
ALTER TABLE "d_project_requests" ADD COLUMN     "observation" TEXT,
ADD COLUMN     "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "d_project_quotes";

-- DropTable
DROP TABLE "d_project_request_details";

-- DropTable
DROP TABLE "d_project_request_details_certifications";

-- DropTable
DROP TABLE "d_project_request_details_companies";

-- DropTable
DROP TABLE "d_project_request_details_documents";

-- DropTable
DROP TABLE "d_project_request_details_ndas";

-- DropTable
DROP TABLE "d_project_request_details_quotations";

-- DropTable
DROP TABLE "d_project_request_details_specialties";

-- DropTable
DROP TABLE "d_projects";

-- CreateTable
CREATE TABLE "d_project_request_certifications" (
    "id" SERIAL NOT NULL,
    "projectRequestId" INTEGER NOT NULL,
    "certificationId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_project_request_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_project_request_specialties" (
    "id" SERIAL NOT NULL,
    "projectRequestId" INTEGER NOT NULL,
    "specialtyId" INTEGER NOT NULL,
    "scopeId" INTEGER,
    "subscopeId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_project_request_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_project_request_companies" (
    "id" SERIAL NOT NULL,
    "projectRequestId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_project_request_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_project_request_ndas" (
    "id" SERIAL NOT NULL,
    "projectRequestCompanyId" INTEGER NOT NULL,
    "requirementSpecialtyId" INTEGER,
    "requirementCertificationId" INTEGER,
    "ndaFile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),

    CONSTRAINT "d_project_request_ndas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_project_request_documents" (
    "id" SERIAL NOT NULL,
    "projectRequestRequirementNDAId" INTEGER NOT NULL,
    "documentFile" TEXT,
    "documentFileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),

    CONSTRAINT "d_project_request_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_project_request_quotations" (
    "id" SERIAL NOT NULL,
    "projectRequestCompanyId" INTEGER NOT NULL,
    "quotationFile" TEXT,
    "quotationFileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),

    CONSTRAINT "d_project_request_quotations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "d_project_request_certifications_isDeleted_isActive_idx" ON "d_project_request_certifications"("isDeleted", "isActive");

-- CreateIndex
CREATE INDEX "d_project_request_specialties_isDeleted_isActive_idx" ON "d_project_request_specialties"("isDeleted", "isActive");

-- CreateIndex
CREATE INDEX "d_project_request_companies_isDeleted_isActive_idx" ON "d_project_request_companies"("isDeleted", "isActive");

-- CreateIndex
CREATE INDEX "d_project_request_ndas_isDeleted_isActive_idx" ON "d_project_request_ndas"("isDeleted", "isActive");

-- CreateIndex
CREATE INDEX "d_project_request_documents_isDeleted_isActive_idx" ON "d_project_request_documents"("isDeleted", "isActive");

-- CreateIndex
CREATE INDEX "d_project_request_quotations_isDeleted_isActive_idx" ON "d_project_request_quotations"("isDeleted", "isActive");

-- AddForeignKey
ALTER TABLE "d_project_request_certifications" ADD CONSTRAINT "d_project_request_certifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_certifications" ADD CONSTRAINT "d_project_request_certifications_projectRequestId_fkey" FOREIGN KEY ("projectRequestId") REFERENCES "d_project_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_specialties" ADD CONSTRAINT "d_project_request_specialties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_specialties" ADD CONSTRAINT "d_project_request_specialties_projectRequestId_fkey" FOREIGN KEY ("projectRequestId") REFERENCES "d_project_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_specialties" ADD CONSTRAINT "d_project_request_specialties_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "c_specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_specialties" ADD CONSTRAINT "d_project_request_specialties_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "c_scopes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_specialties" ADD CONSTRAINT "d_project_request_specialties_subscopeId_fkey" FOREIGN KEY ("subscopeId") REFERENCES "c_subscopes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_companies" ADD CONSTRAINT "d_project_request_companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_companies" ADD CONSTRAINT "d_project_request_companies_projectRequestId_fkey" FOREIGN KEY ("projectRequestId") REFERENCES "d_project_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_companies" ADD CONSTRAINT "d_project_request_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "d_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_ndas" ADD CONSTRAINT "d_project_request_ndas_projectRequestCompanyId_fkey" FOREIGN KEY ("projectRequestCompanyId") REFERENCES "d_project_request_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_ndas" ADD CONSTRAINT "d_project_request_ndas_requirementSpecialtyId_fkey" FOREIGN KEY ("requirementSpecialtyId") REFERENCES "d_project_request_specialties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_ndas" ADD CONSTRAINT "d_project_request_ndas_requirementCertificationId_fkey" FOREIGN KEY ("requirementCertificationId") REFERENCES "d_project_request_certifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_ndas" ADD CONSTRAINT "d_project_request_ndas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_documents" ADD CONSTRAINT "d_project_request_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_documents" ADD CONSTRAINT "d_project_request_documents_projectRequestRequirementNDAId_fkey" FOREIGN KEY ("projectRequestRequirementNDAId") REFERENCES "d_project_request_ndas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_quotations" ADD CONSTRAINT "d_project_request_quotations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_quotations" ADD CONSTRAINT "d_project_request_quotations_projectRequestCompanyId_fkey" FOREIGN KEY ("projectRequestCompanyId") REFERENCES "d_project_request_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
