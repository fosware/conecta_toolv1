/*
  Warnings:

  - A unique constraint covering the columns `[comercialName]` on the table `d_companies` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `comercialName` to the `d_companies` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "d_companies" ADD COLUMN     "comercialName" TEXT NOT NULL,
ADD COLUMN     "shifts_profile_link" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "d_companies_comercialName_key" ON "d_companies"("comercialName");
