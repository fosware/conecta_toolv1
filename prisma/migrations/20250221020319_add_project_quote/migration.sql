/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `c_project_types` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "c_project_types_name_key" ON "c_project_types"("name");
