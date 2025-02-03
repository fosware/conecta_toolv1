/*
  Warnings:

  - You are about to drop the `rel_associate_scopes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "rel_associate_scopes" DROP CONSTRAINT "rel_associate_scopes_associateId_fkey";

-- DropForeignKey
ALTER TABLE "rel_associate_scopes" DROP CONSTRAINT "rel_associate_scopes_scopeId_fkey";

-- DropForeignKey
ALTER TABLE "rel_associate_scopes" DROP CONSTRAINT "rel_associate_scopes_specialtyId_fkey";

-- DropForeignKey
ALTER TABLE "rel_associate_scopes" DROP CONSTRAINT "rel_associate_scopes_subscopeId_fkey";

-- DropForeignKey
ALTER TABLE "rel_associate_scopes" DROP CONSTRAINT "rel_associate_scopes_userId_fkey";

-- DropTable
DROP TABLE "rel_associate_scopes";

-- CreateTable
CREATE TABLE "AssociateScopes" (
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

    CONSTRAINT "AssociateScopes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssociateScopes_associateId_idx" ON "AssociateScopes"("associateId");

-- CreateIndex
CREATE INDEX "AssociateScopes_specialtyId_idx" ON "AssociateScopes"("specialtyId");

-- CreateIndex
CREATE INDEX "AssociateScopes_scopeId_idx" ON "AssociateScopes"("scopeId");

-- CreateIndex
CREATE INDEX "AssociateScopes_subscopeId_idx" ON "AssociateScopes"("subscopeId");

-- CreateIndex
CREATE INDEX "AssociateScopes_userId_idx" ON "AssociateScopes"("userId");

-- AddForeignKey
ALTER TABLE "AssociateScopes" ADD CONSTRAINT "AssociateScopes_associateId_fkey" FOREIGN KEY ("associateId") REFERENCES "d_associates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociateScopes" ADD CONSTRAINT "AssociateScopes_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "c_specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociateScopes" ADD CONSTRAINT "AssociateScopes_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "c_scopes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociateScopes" ADD CONSTRAINT "AssociateScopes_subscopeId_fkey" FOREIGN KEY ("subscopeId") REFERENCES "c_subscopes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociateScopes" ADD CONSTRAINT "AssociateScopes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
