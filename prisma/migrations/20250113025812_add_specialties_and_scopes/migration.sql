/*
  Warnings:

  - You are about to drop the column `subdivision` on the `d_scopes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "d_scopes" DROP COLUMN "subdivision";

-- CreateTable
CREATE TABLE "d_subscopes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "num" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "scopeId" INTEGER NOT NULL,

    CONSTRAINT "d_subscopes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "d_subscopes_name_key" ON "d_subscopes"("name");

-- AddForeignKey
ALTER TABLE "d_subscopes" ADD CONSTRAINT "d_subscopes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_subscopes" ADD CONSTRAINT "d_subscopes_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "d_scopes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
