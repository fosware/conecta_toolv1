/*
  Warnings:

  - You are about to drop the `AssociateScopes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AssociateScopes" DROP CONSTRAINT "AssociateScopes_associateId_fkey";

-- DropForeignKey
ALTER TABLE "AssociateScopes" DROP CONSTRAINT "AssociateScopes_scopeId_fkey";

-- DropForeignKey
ALTER TABLE "AssociateScopes" DROP CONSTRAINT "AssociateScopes_specialtyId_fkey";

-- DropForeignKey
ALTER TABLE "AssociateScopes" DROP CONSTRAINT "AssociateScopes_subscopeId_fkey";

-- DropForeignKey
ALTER TABLE "AssociateScopes" DROP CONSTRAINT "AssociateScopes_userId_fkey";

-- DropTable
DROP TABLE "AssociateScopes";

-- CreateTable
CREATE TABLE "rel_associate_specialties" (
    "id" SERIAL NOT NULL,
    "associateId" INTEGER NOT NULL,
    "specialtyId" INTEGER NOT NULL,
    "scopeId" INTEGER,
    "subscopeId" INTEGER,
    "materials" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "rel_associate_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rel_associate_specialties_associateId_idx" ON "rel_associate_specialties"("associateId");

-- CreateIndex
CREATE INDEX "rel_associate_specialties_specialtyId_idx" ON "rel_associate_specialties"("specialtyId");

-- CreateIndex
CREATE INDEX "rel_associate_specialties_scopeId_idx" ON "rel_associate_specialties"("scopeId");

-- CreateIndex
CREATE INDEX "rel_associate_specialties_subscopeId_idx" ON "rel_associate_specialties"("subscopeId");

-- CreateIndex
CREATE INDEX "rel_associate_specialties_userId_idx" ON "rel_associate_specialties"("userId");

-- AddForeignKey
ALTER TABLE "rel_associate_specialties" ADD CONSTRAINT "rel_associate_specialties_associateId_fkey" FOREIGN KEY ("associateId") REFERENCES "d_associates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rel_associate_specialties" ADD CONSTRAINT "rel_associate_specialties_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "c_specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rel_associate_specialties" ADD CONSTRAINT "rel_associate_specialties_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "c_scopes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rel_associate_specialties" ADD CONSTRAINT "rel_associate_specialties_subscopeId_fkey" FOREIGN KEY ("subscopeId") REFERENCES "c_subscopes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rel_associate_specialties" ADD CONSTRAINT "rel_associate_specialties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
