-- AlterTable
ALTER TABLE "d_users" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "r_company_users" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "position" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "r_company_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "r_company_users_userId_key" ON "r_company_users"("userId");

-- CreateIndex
CREATE INDEX "r_company_users_isDeleted_isActive_idx" ON "r_company_users"("isDeleted", "isActive");

-- AddForeignKey
ALTER TABLE "r_company_users" ADD CONSTRAINT "r_company_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_company_users" ADD CONSTRAINT "r_company_users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "d_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
