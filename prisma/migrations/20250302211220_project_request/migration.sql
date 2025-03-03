/*
  Warnings:

  - You are about to drop the column `clientId` on the `d_project_requests` table. All the data in the column will be lost.
  - Added the required column `clientAreaId` to the `d_project_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "d_project_requests" DROP COLUMN "clientId",
ADD COLUMN     "clientAreaId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "d_project_requests" ADD CONSTRAINT "d_project_requests_clientAreaId_fkey" FOREIGN KEY ("clientAreaId") REFERENCES "c_client_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
