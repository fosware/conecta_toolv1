-- CreateTable
CREATE TABLE "d_project_requests" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,

    CONSTRAINT "d_project_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_project_request_details" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "projectRequestId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_project_request_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_project_request_details_certifications" (
    "id" SERIAL NOT NULL,
    "projectDetailsId" INTEGER NOT NULL,
    "certificationId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_project_request_details_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_project_request_details_specialties" (
    "id" SERIAL NOT NULL,
    "projectDetailsId" INTEGER NOT NULL,
    "specialtyId" INTEGER NOT NULL,
    "scopeId" INTEGER,
    "subscopeId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_project_request_details_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_project_request_details_companies" (
    "id" SERIAL NOT NULL,
    "projectRequestDetailId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_project_request_details_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_project_request_details_ndas" (
    "id" SERIAL NOT NULL,
    "projectRequestDetailCompaniesId" INTEGER NOT NULL,
    "ndaFile" BYTEA,
    "ndaFileName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_project_request_details_ndas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_project_request_details_documents" (
    "id" SERIAL NOT NULL,
    "projectRequestDetailCompaniesId" INTEGER NOT NULL,
    "documentFile" BYTEA,
    "documentFileName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_project_request_details_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_project_request_details_quotations" (
    "id" SERIAL NOT NULL,
    "projectRequestDetailCompaniesId" INTEGER NOT NULL,
    "quotationFile" BYTEA,
    "quotationFileName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_project_request_details_quotations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "d_project_requests_isDeleted_isActive_idx" ON "d_project_requests"("isDeleted", "isActive");

-- CreateIndex
CREATE INDEX "d_project_request_details_isDeleted_isActive_idx" ON "d_project_request_details"("isDeleted", "isActive");

-- CreateIndex
CREATE INDEX "d_project_request_details_certifications_isDeleted_isActive_idx" ON "d_project_request_details_certifications"("isDeleted", "isActive");

-- CreateIndex
CREATE INDEX "d_project_request_details_specialties_isDeleted_isActive_idx" ON "d_project_request_details_specialties"("isDeleted", "isActive");

-- CreateIndex
CREATE INDEX "d_project_request_details_companies_isDeleted_isActive_idx" ON "d_project_request_details_companies"("isDeleted", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "d_project_request_details_ndas_projectRequestDetailCompanie_key" ON "d_project_request_details_ndas"("projectRequestDetailCompaniesId");

-- CreateIndex
CREATE INDEX "d_project_request_details_ndas_isDeleted_isActive_idx" ON "d_project_request_details_ndas"("isDeleted", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "d_project_request_details_documents_projectRequestDetailCom_key" ON "d_project_request_details_documents"("projectRequestDetailCompaniesId");

-- CreateIndex
CREATE INDEX "d_project_request_details_documents_isDeleted_isActive_idx" ON "d_project_request_details_documents"("isDeleted", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "d_project_request_details_quotations_projectRequestDetailCo_key" ON "d_project_request_details_quotations"("projectRequestDetailCompaniesId");

-- CreateIndex
CREATE INDEX "d_project_request_details_quotations_isDeleted_isActive_idx" ON "d_project_request_details_quotations"("isDeleted", "isActive");

-- AddForeignKey
ALTER TABLE "d_project_requests" ADD CONSTRAINT "d_project_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_details" ADD CONSTRAINT "d_project_request_details_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_details" ADD CONSTRAINT "d_project_request_details_projectRequestId_fkey" FOREIGN KEY ("projectRequestId") REFERENCES "d_project_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_details_certifications" ADD CONSTRAINT "d_project_request_details_certifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_details_certifications" ADD CONSTRAINT "d_project_request_details_certifications_projectDetailsId_fkey" FOREIGN KEY ("projectDetailsId") REFERENCES "d_project_request_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_details_specialties" ADD CONSTRAINT "d_project_request_details_specialties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_details_specialties" ADD CONSTRAINT "d_project_request_details_specialties_projectDetailsId_fkey" FOREIGN KEY ("projectDetailsId") REFERENCES "d_project_request_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_details_companies" ADD CONSTRAINT "d_project_request_details_companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_details_companies" ADD CONSTRAINT "d_project_request_details_companies_projectRequestDetailId_fkey" FOREIGN KEY ("projectRequestDetailId") REFERENCES "d_project_request_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_details_companies" ADD CONSTRAINT "d_project_request_details_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "d_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_details_ndas" ADD CONSTRAINT "d_project_request_details_ndas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_details_ndas" ADD CONSTRAINT "d_project_request_details_ndas_projectRequestDetailCompani_fkey" FOREIGN KEY ("projectRequestDetailCompaniesId") REFERENCES "d_project_request_details_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_details_documents" ADD CONSTRAINT "d_project_request_details_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_details_documents" ADD CONSTRAINT "d_project_request_details_documents_projectRequestDetailCo_fkey" FOREIGN KEY ("projectRequestDetailCompaniesId") REFERENCES "d_project_request_details_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_details_quotations" ADD CONSTRAINT "d_project_request_details_quotations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_details_quotations" ADD CONSTRAINT "d_project_request_details_quotations_projectRequestDetailC_fkey" FOREIGN KEY ("projectRequestDetailCompaniesId") REFERENCES "d_project_request_details_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
