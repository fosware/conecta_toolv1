/*
  Warnings:

  - You are about to drop the `c_proyect_types` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "c_proyect_types" DROP CONSTRAINT "c_proyect_types_userId_fkey";

-- DropForeignKey
ALTER TABLE "d_projects" DROP CONSTRAINT "d_projects_proyectTypeId_fkey";

-- DropTable
DROP TABLE "c_proyect_types";

-- CreateTable
CREATE TABLE "c_project_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "c_project_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "c_project_types_isDeleted_isActive_idx" ON "c_project_types"("isDeleted", "isActive");

-- AddForeignKey
ALTER TABLE "c_project_types" ADD CONSTRAINT "c_project_types_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_projects" ADD CONSTRAINT "d_projects_proyectTypeId_fkey" FOREIGN KEY ("proyectTypeId") REFERENCES "c_project_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
