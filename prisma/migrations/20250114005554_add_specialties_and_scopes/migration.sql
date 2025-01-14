/*
  Warnings:

  - You are about to drop the `d_ceritications` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "d_ceritications" DROP CONSTRAINT "d_ceritications_userId_fkey";

-- DropTable
DROP TABLE "d_ceritications";

-- CreateTable
CREATE TABLE "c_certifications" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "c_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "c_certifications_name_key" ON "c_certifications"("name");

-- AddForeignKey
ALTER TABLE "c_certifications" ADD CONSTRAINT "c_certifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
