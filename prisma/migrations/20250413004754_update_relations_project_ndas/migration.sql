/*
  Warnings:

  - You are about to drop the column `clientCompanyNDAId` on the `d_project_request_companies` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "d_project_request_companies" DROP CONSTRAINT "d_project_request_companies_clientCompanyNDAId_fkey";

-- AlterTable
ALTER TABLE "d_project_request_companies" DROP COLUMN "clientCompanyNDAId";
