/*
  Warnings:

  - You are about to drop the column `projectRequestRequirementQuotationId` on the `d_client_quotation_summaries` table. All the data in the column will be lost.
  - Added the required column `projectRequestId` to the `d_client_quotation_summaries` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "d_client_quotation_summaries" DROP CONSTRAINT "d_client_quotation_summaries_projectRequestRequirementQuot_fkey";

-- AlterTable
ALTER TABLE "d_client_quotation_summaries" DROP COLUMN "projectRequestRequirementQuotationId",
ADD COLUMN     "clientPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "projectRequestId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "d_client_quotation_summaries" ADD CONSTRAINT "d_client_quotation_summaries_projectRequestId_fkey" FOREIGN KEY ("projectRequestId") REFERENCES "d_project_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
