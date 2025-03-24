-- CreateTable
CREATE TABLE "d_project_request_company_status_logs" (
    "id" SERIAL NOT NULL,
    "projectRequestCompanyId" INTEGER NOT NULL,
    "dateTimeMessage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_project_request_company_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "d_project_request_company_status_logs_isDeleted_isActive_idx" ON "d_project_request_company_status_logs"("isDeleted", "isActive");

-- AddForeignKey
ALTER TABLE "d_project_request_company_status_logs" ADD CONSTRAINT "d_project_request_company_status_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_request_company_status_logs" ADD CONSTRAINT "d_project_request_company_status_logs_projectRequestCompan_fkey" FOREIGN KEY ("projectRequestCompanyId") REFERENCES "d_project_request_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
