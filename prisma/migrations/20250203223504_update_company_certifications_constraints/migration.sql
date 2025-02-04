-- DropIndex
DROP INDEX "r_company_certifications_companyId_certificationId_key";

-- CreateIndex
CREATE INDEX "r_company_certifications_companyId_certificationId_expirati_idx" ON "r_company_certifications"("companyId", "certificationId", "expirationDate");
