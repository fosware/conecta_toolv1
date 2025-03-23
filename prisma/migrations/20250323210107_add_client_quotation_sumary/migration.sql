-- AlterTable
ALTER TABLE "d_project_request_quotations" ADD COLUMN     "isClientSelected" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "d_client_quotation_summaries" (
    "id" SERIAL NOT NULL,
    "projectRequestRequirementQuotationId" INTEGER NOT NULL,
    "quotationFile" BYTEA,
    "quotationFileName" TEXT,
    "dateQuotationClient" TIMESTAMP(3) NOT NULL,
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_client_quotation_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "d_client_quotation_summaries_isDeleted_isActive_idx" ON "d_client_quotation_summaries"("isDeleted", "isActive");

-- AddForeignKey
ALTER TABLE "d_client_quotation_summaries" ADD CONSTRAINT "d_client_quotation_summaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_client_quotation_summaries" ADD CONSTRAINT "d_client_quotation_summaries_projectRequestRequirementQuot_fkey" FOREIGN KEY ("projectRequestRequirementQuotationId") REFERENCES "d_project_request_quotations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
