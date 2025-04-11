/*
  Warnings:

  - You are about to drop the column `ndaDateUploaded` on the `d_client_company_ndas` table. All the data in the column will be lost.
  - You are about to drop the column `ndaFile` on the `d_client_company_ndas` table. All the data in the column will be lost.
  - You are about to drop the column `ndaFileName` on the `d_client_company_ndas` table. All the data in the column will be lost.
  - You are about to drop the column `ndaSignedAt` on the `d_client_company_ndas` table. All the data in the column will be lost.
  - Made the column `ndaSignedFile` on table `d_client_company_ndas` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ndaSignedFileName` on table `d_client_company_ndas` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ndaExpirationDate` on table `d_client_company_ndas` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "d_client_company_ndas" DROP COLUMN "ndaDateUploaded",
DROP COLUMN "ndaFile",
DROP COLUMN "ndaFileName",
DROP COLUMN "ndaSignedAt",
ALTER COLUMN "ndaSignedFile" SET NOT NULL,
ALTER COLUMN "ndaSignedFileName" SET NOT NULL,
ALTER COLUMN "ndaExpirationDate" SET NOT NULL;
