/*
  Warnings:

  - The `documentFile` column on the `d_project_request_documents` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "d_project_request_documents" DROP COLUMN "documentFile",
ADD COLUMN     "documentFile" BYTEA;
