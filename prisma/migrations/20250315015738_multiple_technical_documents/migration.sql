-- DropIndex
DROP INDEX "d_project_request_documents_projectRequestCompanyId_key";

-- CreateIndex
CREATE INDEX "d_project_request_documents_projectRequestCompanyId_idx" ON "d_project_request_documents"("projectRequestCompanyId");
