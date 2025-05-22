/*
  Warnings:

  - You are about to drop the column `projectRequestCompanyId` on the `d_project_request_documents` table. All the data in the column will be lost.
  - Added the required column `projectRequestId` to the `d_project_request_documents` table without a default value. This is not possible if the table is not empty.

*/

-- Primero, agregamos la columna projectRequestId como nullable
ALTER TABLE "d_project_request_documents" ADD COLUMN "projectRequestId" INTEGER;

-- Actualizamos los registros existentes para establecer el projectRequestId
-- basado en la relación actual a través de ProjectRequestCompany -> ProjectRequirements -> ProjectRequest
UPDATE "d_project_request_documents" AS docs
SET "projectRequestId" = pr."projectRequestId"
FROM "d_project_request_companies" AS prc
JOIN "d_project_requirements" AS pr ON prc."projectRequirementsId" = pr."id"
WHERE docs."projectRequestCompanyId" = prc."id";

-- DropForeignKey
ALTER TABLE "d_project_request_documents" DROP CONSTRAINT "d_project_request_documents_projectRequestCompanyId_fkey";

-- DropIndex
DROP INDEX "d_project_request_documents_projectRequestCompanyId_idx";

-- Hacemos la columna projectRequestId NOT NULL después de actualizarla
ALTER TABLE "d_project_request_documents" ALTER COLUMN "projectRequestId" SET NOT NULL;

-- Finalmente, eliminamos la columna projectRequestCompanyId
ALTER TABLE "d_project_request_documents" DROP COLUMN "projectRequestCompanyId";

-- CreateIndex
CREATE INDEX "d_project_request_documents_projectRequestId_idx" ON "d_project_request_documents"("projectRequestId");

-- AddForeignKey
ALTER TABLE "d_project_request_documents" ADD CONSTRAINT "d_project_request_documents_projectRequestId_fkey" FOREIGN KEY ("projectRequestId") REFERENCES "d_project_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Renombramos el modelo en el esquema (esto no afecta el nombre de la tabla en la base de datos)
-- El modelo se llama ahora ProjectRequestDocuments en lugar de ProjectRequestRequirementDocuments
