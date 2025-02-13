/*
  Warnings:

  - A unique constraint covering the columns `[name,specialtyId]` on the table `c_scopes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,scopeId]` on the table `c_subscopes` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "c_scopes_name_key";

-- DropIndex
DROP INDEX "c_subscopes_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "c_scopes_name_specialtyId_key" ON "c_scopes"("name", "specialtyId");

-- CreateIndex
CREATE UNIQUE INDEX "c_subscopes_name_scopeId_key" ON "c_subscopes"("name", "scopeId");
