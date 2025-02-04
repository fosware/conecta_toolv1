/*
  Warnings:

  - Added the required column `expirationDate` to the `r_company_certifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "r_company_certifications" ADD COLUMN     "expirationDate" DATE NOT NULL;
