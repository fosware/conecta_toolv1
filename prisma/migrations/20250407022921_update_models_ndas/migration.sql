-- CreateTable
CREATE TABLE "d_client_company_ndas" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "ndaFile" BYTEA,
    "ndaFileName" TEXT,
    "ndaDateUploaded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ndaSignedFile" BYTEA,
    "ndaSignedFileName" TEXT,
    "ndaSignedAt" TIMESTAMP(3),
    "ndaExpirationDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_client_company_ndas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "d_client_company_ndas_isDeleted_isActive_idx" ON "d_client_company_ndas"("isDeleted", "isActive");

-- AddForeignKey
ALTER TABLE "d_client_company_ndas" ADD CONSTRAINT "d_client_company_ndas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_client_company_ndas" ADD CONSTRAINT "d_client_company_ndas_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "c_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_client_company_ndas" ADD CONSTRAINT "d_client_company_ndas_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "d_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
