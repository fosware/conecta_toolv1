/*
  Warnings:

  - You are about to drop the column `terms_and_conditions` on the `c_client_areas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "c_client_areas" DROP COLUMN "terms_and_conditions",
ADD COLUMN     "observations" TEXT;
