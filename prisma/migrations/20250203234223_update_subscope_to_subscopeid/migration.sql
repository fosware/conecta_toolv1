/*
  Warnings:

  - You are about to drop the column `subscope` on the `r_company_specialties` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,specialtyId,scopeId,subscopeId]` on the table `r_company_specialties` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "r_company_specialties" DROP CONSTRAINT "r_company_specialties_subscope_fkey";

-- DropIndex
DROP INDEX "r_company_specialties_companyId_specialtyId_scopeId_subscop_key";

-- AlterTable
ALTER TABLE "r_company_specialties" DROP COLUMN "subscope",
ADD COLUMN     "subscopeId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "r_company_specialties_companyId_specialtyId_scopeId_subscop_key" ON "r_company_specialties"("companyId", "specialtyId", "scopeId", "subscopeId");

-- AddForeignKey
ALTER TABLE "r_company_specialties" ADD CONSTRAINT "r_company_specialties_subscopeId_fkey" FOREIGN KEY ("subscopeId") REFERENCES "c_subscopes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
