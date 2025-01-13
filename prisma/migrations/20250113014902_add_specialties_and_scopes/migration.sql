/*
  Warnings:

  - A unique constraint covering the columns `[num]` on the table `d_scopes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[num]` on the table `d_specialties` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `num` to the `d_scopes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `num` to the `d_specialties` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "d_scopes" ADD COLUMN     "num" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "d_specialties" ADD COLUMN     "num" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "d_scopes_num_key" ON "d_scopes"("num");

-- CreateIndex
CREATE UNIQUE INDEX "d_specialties_num_key" ON "d_specialties"("num");
