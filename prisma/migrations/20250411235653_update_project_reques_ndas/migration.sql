/*
  Warnings:

  - You are about to drop the column `ndaDateUploaded` on the `d_project_request_companies` table. All the data in the column will be lost.
  - You are about to drop the column `ndaFile` on the `d_project_request_companies` table. All the data in the column will be lost.
  - You are about to drop the column `ndaFileName` on the `d_project_request_companies` table. All the data in the column will be lost.
  - You are about to drop the column `ndaSignedAt` on the `d_project_request_companies` table. All the data in the column will be lost.
  - You are about to drop the column `ndaSignedFile` on the `d_project_request_companies` table. All the data in the column will be lost.
  - You are about to drop the column `ndaSignedFileName` on the `d_project_request_companies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "d_project_request_companies" DROP COLUMN "ndaDateUploaded",
DROP COLUMN "ndaFile",
DROP COLUMN "ndaFileName",
DROP COLUMN "ndaSignedAt",
DROP COLUMN "ndaSignedFile",
DROP COLUMN "ndaSignedFileName",
ADD COLUMN     "clientCompanyNdaId" INTEGER;

-- AddForeignKey
ALTER TABLE "d_project_request_companies" ADD CONSTRAINT "d_project_request_companies_clientCompanyNdaId_fkey" FOREIGN KEY ("clientCompanyNdaId") REFERENCES "d_client_company_ndas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
