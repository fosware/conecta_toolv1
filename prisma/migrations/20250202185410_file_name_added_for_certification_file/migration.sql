/*
  Warnings:

  - Added the required column `certificationFileName` to the `rel_associate_certifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "rel_associate_certifications" ADD COLUMN     "certificationFileName" TEXT NOT NULL;
