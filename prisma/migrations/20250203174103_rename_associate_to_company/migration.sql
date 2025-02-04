/*
  Warnings:

  - You are about to drop the `d_associates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rel_associate_certifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rel_associate_specialties` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "d_associates" DROP CONSTRAINT "d_associates_stateId_fkey";

-- DropForeignKey
ALTER TABLE "d_associates" DROP CONSTRAINT "d_associates_userId_fkey";

-- DropForeignKey
ALTER TABLE "rel_associate_certifications" DROP CONSTRAINT "rel_associate_certifications_associateId_fkey";

-- DropForeignKey
ALTER TABLE "rel_associate_certifications" DROP CONSTRAINT "rel_associate_certifications_certificationId_fkey";

-- DropForeignKey
ALTER TABLE "rel_associate_certifications" DROP CONSTRAINT "rel_associate_certifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "rel_associate_specialties" DROP CONSTRAINT "rel_associate_specialties_associateId_fkey";

-- DropForeignKey
ALTER TABLE "rel_associate_specialties" DROP CONSTRAINT "rel_associate_specialties_scopeId_fkey";

-- DropForeignKey
ALTER TABLE "rel_associate_specialties" DROP CONSTRAINT "rel_associate_specialties_specialtyId_fkey";

-- DropForeignKey
ALTER TABLE "rel_associate_specialties" DROP CONSTRAINT "rel_associate_specialties_subscopeId_fkey";

-- DropForeignKey
ALTER TABLE "rel_associate_specialties" DROP CONSTRAINT "rel_associate_specialties_userId_fkey";

-- DropTable
DROP TABLE "d_associates";

-- DropTable
DROP TABLE "rel_associate_certifications";

-- DropTable
DROP TABLE "rel_associate_specialties";

-- CreateTable
CREATE TABLE "d_companies" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "externalNumber" TEXT NOT NULL,
    "internalNumber" TEXT,
    "neighborhood" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "machineCount" INTEGER NOT NULL,
    "employeeCount" INTEGER NOT NULL,
    "shifts" TEXT,
    "achievementDescription" TEXT,
    "profile" TEXT,
    "nda" BYTEA,
    "ndaFileName" TEXT,
    "companyLogo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "d_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "r_company_certifications" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "certificationId" INTEGER NOT NULL,
    "certificateFile" BYTEA,
    "certificateFileName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "r_company_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "r_company_specialties" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "specialtyId" INTEGER NOT NULL,
    "scopeId" INTEGER,
    "subscope" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "r_company_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "d_companies_companyName_key" ON "d_companies"("companyName");

-- CreateIndex
CREATE UNIQUE INDEX "d_companies_email_key" ON "d_companies"("email");

-- CreateIndex
CREATE INDEX "d_companies_isDeleted_isActive_idx" ON "d_companies"("isDeleted", "isActive");

-- CreateIndex
CREATE INDEX "r_company_certifications_isDeleted_isActive_idx" ON "r_company_certifications"("isDeleted", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "r_company_certifications_companyId_certificationId_key" ON "r_company_certifications"("companyId", "certificationId");

-- CreateIndex
CREATE INDEX "r_company_specialties_isDeleted_isActive_idx" ON "r_company_specialties"("isDeleted", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "r_company_specialties_companyId_specialtyId_scopeId_subscop_key" ON "r_company_specialties"("companyId", "specialtyId", "scopeId", "subscope");

-- AddForeignKey
ALTER TABLE "d_companies" ADD CONSTRAINT "d_companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_companies" ADD CONSTRAINT "d_companies_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "c_location_states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_company_certifications" ADD CONSTRAINT "r_company_certifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_company_certifications" ADD CONSTRAINT "r_company_certifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "d_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_company_certifications" ADD CONSTRAINT "r_company_certifications_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "c_certifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_company_specialties" ADD CONSTRAINT "r_company_specialties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_company_specialties" ADD CONSTRAINT "r_company_specialties_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "d_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_company_specialties" ADD CONSTRAINT "r_company_specialties_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "c_specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_company_specialties" ADD CONSTRAINT "r_company_specialties_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "c_scopes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_company_specialties" ADD CONSTRAINT "r_company_specialties_subscope_fkey" FOREIGN KEY ("subscope") REFERENCES "c_subscopes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
