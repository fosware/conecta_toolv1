/*
  Warnings:

  - You are about to drop the column `projectTypeId` on the `d_project_request_quotations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "d_project_request_quotations" DROP COLUMN "projectTypeId",
ADD COLUMN     "projectTypesId" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "d_project_request_quotations" ADD CONSTRAINT "d_project_request_quotations_projectTypesId_fkey" FOREIGN KEY ("projectTypesId") REFERENCES "c_project_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
