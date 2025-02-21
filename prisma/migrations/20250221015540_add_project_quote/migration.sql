/*
  Warnings:

  - You are about to drop the column `userId` on the `c_project_types` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "c_project_types" DROP CONSTRAINT "c_project_types_userId_fkey";

-- AlterTable
ALTER TABLE "c_project_types" DROP COLUMN "userId";
