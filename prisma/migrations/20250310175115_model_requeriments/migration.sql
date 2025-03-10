/*
  Warnings:

  - You are about to drop the column `projectRequestId` on the `d_project_request_specialties` table. All the data in the column will be lost.
  - Added the required column `projectRequirementsId` to the `d_project_request_certifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectRequirementsId` to the `d_project_request_companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectRequirementsId` to the `d_project_request_specialties` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "d_project_request_certifications" DROP CONSTRAINT "d_project_request_certifications_projectRequestId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_companies" DROP CONSTRAINT "d_project_request_companies_projectRequestId_fkey";

-- DropForeignKey
ALTER TABLE "d_project_request_specialties" DROP CONSTRAINT "d_project_request_specialties_projectRequestId_fkey";

-- AlterTable
ALTER TABLE "d_project_request_certifications" ADD COLUMN     "projectRequirementsId" INTEGER NOT NULL,
ALTER COLUMN "projectRequestId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "d_project_request_companies" ADD COLUMN     "projectRequirementsId" INTEGER NOT NULL,
ALTER COLUMN "projectRequestId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "d_project_request_specialties" DROP COLUMN "projectRequestId",
ADD COLUMN     "projectRequirementsId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "d_project_requirements" (
    "id" SERIAL NOT NULL,
    "projectRequestId" INTEGER NOT NULL,
    "requirementName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_project_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "d_project_requirements_isDeleted_isActive_idx" ON "d_project_requirements"("isDeleted", "isActive");

-- AddForeignKey
ALTER TABLE "d_project_requirements" ADD CONSTRAINT "d_project_requirements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_requirements" ADD CONSTRAINT "d_project_requirements_projectRequestId_fkey" FOREIGN KEY ("projectRequestId") REFERENCES "d_project_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_certifications" ADD CONSTRAINT "d_project_request_certifications_projectRequirementsId_fkey" FOREIGN KEY ("projectRequirementsId") REFERENCES "d_project_requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_specialties" ADD CONSTRAINT "d_project_request_specialties_projectRequirementsId_fkey" FOREIGN KEY ("projectRequirementsId") REFERENCES "d_project_requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_companies" ADD CONSTRAINT "d_project_request_companies_projectRequirementsId_fkey" FOREIGN KEY ("projectRequirementsId") REFERENCES "d_project_requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
