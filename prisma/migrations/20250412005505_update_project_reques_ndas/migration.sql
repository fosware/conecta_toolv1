/*
  Warnings:

  - You are about to drop the column `clientCompanyNdaId` on the `d_project_request_companies` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "d_project_request_companies" DROP CONSTRAINT "d_project_request_companies_clientCompanyNdaId_fkey";

-- AlterTable
ALTER TABLE "d_project_request_companies" DROP COLUMN "clientCompanyNdaId",
ADD COLUMN     "clientCompanyNDAId" INTEGER;

-- AddForeignKey
ALTER TABLE "d_project_request_companies" ADD CONSTRAINT "d_project_request_companies_clientCompanyNDAId_fkey" FOREIGN KEY ("clientCompanyNDAId") REFERENCES "d_client_company_ndas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
