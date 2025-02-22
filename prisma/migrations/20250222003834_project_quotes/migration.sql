/*
  Warnings:

  - You are about to drop the `d_quotes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "d_quotes" DROP CONSTRAINT "d_quotes_companyId_fkey";

-- DropForeignKey
ALTER TABLE "d_quotes" DROP CONSTRAINT "d_quotes_projectId_fkey";

-- DropForeignKey
ALTER TABLE "d_quotes" DROP CONSTRAINT "d_quotes_userId_fkey";

-- DropTable
DROP TABLE "d_quotes";

-- CreateTable
CREATE TABLE "d_project_quotes" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_project_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "d_project_quotes_isDeleted_isActive_idx" ON "d_project_quotes"("isDeleted", "isActive");

-- AddForeignKey
ALTER TABLE "d_project_quotes" ADD CONSTRAINT "d_project_quotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_quotes" ADD CONSTRAINT "d_project_quotes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "d_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_quotes" ADD CONSTRAINT "d_project_quotes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "d_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
