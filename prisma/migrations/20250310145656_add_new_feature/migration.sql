/*
  Warnings:

  - The `ndaFile` column on the `d_project_request_companies` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `ndaSignedFile` column on the `d_project_request_companies` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `d_status_project_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "d_project_requests" DROP CONSTRAINT "d_project_requests_statusId_fkey";

-- DropForeignKey
ALTER TABLE "d_status_project_requests" DROP CONSTRAINT "d_status_project_requests_userId_fkey";

-- AlterTable
ALTER TABLE "d_project_request_companies" ADD COLUMN     "statusId" INTEGER NOT NULL DEFAULT 1,
DROP COLUMN "ndaFile",
ADD COLUMN     "ndaFile" BYTEA,
DROP COLUMN "ndaSignedFile",
ADD COLUMN     "ndaSignedFile" BYTEA;

-- DropTable
DROP TABLE "d_status_project_requests";

-- CreateTable
CREATE TABLE "c_status_project_requests" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "c_status_project_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "c_status_project_requests_name_key" ON "c_status_project_requests"("name");

-- CreateIndex
CREATE INDEX "c_status_project_requests_isDeleted_isActive_idx" ON "c_status_project_requests"("isDeleted", "isActive");

-- AddForeignKey
ALTER TABLE "c_status_project_requests" ADD CONSTRAINT "c_status_project_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_requests" ADD CONSTRAINT "d_project_requests_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "c_status_project_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_companies" ADD CONSTRAINT "d_project_request_companies_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "c_status_project_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
