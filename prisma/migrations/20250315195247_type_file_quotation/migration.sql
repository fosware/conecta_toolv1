/*
  Warnings:

  - The `quotationFile` column on the `d_project_request_quotations` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "d_project_request_quotations" DROP COLUMN "quotationFile",
ADD COLUMN     "quotationFile" BYTEA;
