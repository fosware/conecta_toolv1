/*
  Warnings:

  - You are about to drop the column `wesite` on the `d_companies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "d_companies" DROP COLUMN "wesite",
ADD COLUMN     "website" TEXT;
