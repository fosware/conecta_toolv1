/*
  Warnings:

  - You are about to drop the column `shifts_profile_link` on the `d_companies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "d_companies" DROP COLUMN "shifts_profile_link",
ADD COLUMN     "shiftsProfileLink" TEXT;
