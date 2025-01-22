/*
  Warnings:

  - You are about to drop the `d_scopes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `d_specialties` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `d_subscopes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "d_scopes" DROP CONSTRAINT "d_scopes_specialtyId_fkey";

-- DropForeignKey
ALTER TABLE "d_scopes" DROP CONSTRAINT "d_scopes_userId_fkey";

-- DropForeignKey
ALTER TABLE "d_specialties" DROP CONSTRAINT "d_specialties_userId_fkey";

-- DropForeignKey
ALTER TABLE "d_subscopes" DROP CONSTRAINT "d_subscopes_scopeId_fkey";

-- DropForeignKey
ALTER TABLE "d_subscopes" DROP CONSTRAINT "d_subscopes_userId_fkey";

-- DropTable
DROP TABLE "d_scopes";

-- DropTable
DROP TABLE "d_specialties";

-- DropTable
DROP TABLE "d_subscopes";

-- CreateTable
CREATE TABLE "c_specialties" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "num" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "c_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_scopes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "num" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "specialtyId" INTEGER NOT NULL,

    CONSTRAINT "c_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_subscopes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "num" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "scopeId" INTEGER NOT NULL,

    CONSTRAINT "c_subscopes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "c_specialties_name_key" ON "c_specialties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "c_specialties_num_key" ON "c_specialties"("num");

-- CreateIndex
CREATE UNIQUE INDEX "c_scopes_name_key" ON "c_scopes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "c_subscopes_name_key" ON "c_subscopes"("name");

-- AddForeignKey
ALTER TABLE "c_specialties" ADD CONSTRAINT "c_specialties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_scopes" ADD CONSTRAINT "c_scopes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_scopes" ADD CONSTRAINT "c_scopes_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "c_specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_subscopes" ADD CONSTRAINT "c_subscopes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_subscopes" ADD CONSTRAINT "c_subscopes_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "c_scopes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
