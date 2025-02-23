/*
  Warnings:

  - Added the required column `clientAreaId` to the `d_projects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "d_projects" ADD COLUMN     "clientAreaId" INTEGER NOT NULL,
ADD COLUMN     "nameDrawRequest" TEXT;
