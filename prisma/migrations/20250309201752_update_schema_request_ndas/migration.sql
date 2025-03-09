/*
  Warnings:

  - You are about to drop the column `projectRequestRequirementNDAId` on the `d_project_request_documents` table. All the data in the column will be lost.
  - You are about to drop the `d_project_request_ndas` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[projectRequestCompanyId]` on the table `d_project_request_documents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectRequestCompanyId]` on the table `d_project_request_quotations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectRequestCompanyId` to the `d_project_request_documents` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "d_project_request_documents" DROP CONSTRAINT "d_project_request_documents_projectRequestRequirementNDAId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_ndas" DROP CONSTRAINT "d_project_request_ndas_projectRequestCompanyId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_ndas" DROP CONSTRAINT "d_project_request_ndas_requirementCertificationId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_ndas" DROP CONSTRAINT "d_project_request_ndas_requirementSpecialtyId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_ndas" DROP CONSTRAINT "d_project_request_ndas_userId_fkey";

-- AlterTable
ALTER TABLE "d_project_request_companies" ADD COLUMN     "ndaFile" TEXT,
ADD COLUMN     "ndaFileName" TEXT,
ADD COLUMN     "ndaSignedAt" TIMESTAMP(3),
ADD COLUMN     "ndaSignedFile" TEXT,
ADD COLUMN     "ndaSignedFileName" TEXT;

-- AlterTable
ALTER TABLE "d_project_request_documents" DROP COLUMN "projectRequestRequirementNDAId",
ADD COLUMN     "projectRequestCompanyId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "d_project_request_ndas";

-- CreateIndex
CREATE UNIQUE INDEX "d_project_request_documents_projectRequestCompanyId_key" ON "d_project_request_documents"("projectRequestCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "d_project_request_quotations_projectRequestCompanyId_key" ON "d_project_request_quotations"("projectRequestCompanyId");

-- AddForeignKey
ALTER TABLE "d_project_request_documents" ADD CONSTRAINT "d_project_request_documents_projectRequestCompanyId_fkey" FOREIGN KEY ("projectRequestCompanyId") REFERENCES "d_project_request_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
