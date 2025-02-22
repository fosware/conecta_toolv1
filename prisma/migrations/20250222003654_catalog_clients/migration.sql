/*
  Warnings:

  - You are about to drop the column `contactEmail` on the `c_clients` table. All the data in the column will be lost.
  - You are about to drop the column `contactName` on the `c_clients` table. All the data in the column will be lost.
  - You are about to drop the column `contactPhone` on the `c_clients` table. All the data in the column will be lost.
  - Added the required column `registered_address` to the `c_clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rfc` to the `c_clients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "c_clients" DROP COLUMN "contactEmail",
DROP COLUMN "contactName",
DROP COLUMN "contactPhone",
ADD COLUMN     "registered_address" TEXT NOT NULL,
ADD COLUMN     "rfc" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "c_client_areas" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "areaName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "terms_and_conditions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "c_client_areas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "c_client_areas" ADD CONSTRAINT "c_client_areas_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "c_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
