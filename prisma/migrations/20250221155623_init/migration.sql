/*
  Warnings:

  - You are about to drop the `cat_clients` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "cat_clients" DROP CONSTRAINT "cat_clients_userId_fkey";

-- DropForeignKey
ALTER TABLE "d_projects" DROP CONSTRAINT "d_projects_clientId_fkey";

-- DropTable
DROP TABLE "cat_clients";

-- CreateTable
CREATE TABLE "c_clients" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "c_clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "c_clients_isDeleted_isActive_idx" ON "c_clients"("isDeleted", "isActive");

-- AddForeignKey
ALTER TABLE "c_clients" ADD CONSTRAINT "c_clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_projects" ADD CONSTRAINT "d_projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "c_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
