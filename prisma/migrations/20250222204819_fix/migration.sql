/*
  Warnings:

  - You are about to drop the column `proyectTypeId` on the `d_projects` table. All the data in the column will be lost.
  - Added the required column `projectTypeId` to the `d_projects` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "d_projects" DROP CONSTRAINT "d_projects_proyectTypeId_fkey";

-- AlterTable
ALTER TABLE "d_projects" DROP COLUMN "proyectTypeId",
ADD COLUMN     "projectTypeId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "d_projects" ADD CONSTRAINT "d_projects_projectTypeId_fkey" FOREIGN KEY ("projectTypeId") REFERENCES "c_project_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
