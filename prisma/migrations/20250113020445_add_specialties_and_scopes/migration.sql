/*
  Warnings:

  - Added the required column `specialtyId` to the `d_scopes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "d_scopes" ADD COLUMN     "specialtyId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "d_scopes" ADD CONSTRAINT "d_scopes_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "d_specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
