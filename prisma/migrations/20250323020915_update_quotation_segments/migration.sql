-- AlterTable
ALTER TABLE "d_project_request_companies" ADD COLUMN     "ndaDateUploaded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "d_project_request_quotations" ADD COLUMN     "additionalDetails" TEXT,
ADD COLUMN     "directCost" DOUBLE PRECISION,
ADD COLUMN     "indirectCost" DOUBLE PRECISION,
ADD COLUMN     "materialCost" DOUBLE PRECISION,
ADD COLUMN     "projectTypeId" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "d_quotation_segments" (
    "id" SERIAL NOT NULL,
    "projectRequestRequirementQuotationId" INTEGER NOT NULL,
    "estimatedDeliveryDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_quotation_segments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "d_quotation_segments_isDeleted_isActive_idx" ON "d_quotation_segments"("isDeleted", "isActive");

-- AddForeignKey
ALTER TABLE "d_quotation_segments" ADD CONSTRAINT "d_quotation_segments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_quotation_segments" ADD CONSTRAINT "d_quotation_segments_projectRequestRequirementQuotationId_fkey" FOREIGN KEY ("projectRequestRequirementQuotationId") REFERENCES "d_project_request_quotations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
