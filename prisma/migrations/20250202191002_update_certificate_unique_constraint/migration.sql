/*
  Warnings:

  - A unique constraint covering the columns `[associateId,certificationId,expiryDate,isDeleted]` on the table `rel_associate_certifications` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "rel_associate_certifications_associateId_certificationId_key";

-- CreateIndex
CREATE UNIQUE INDEX "rel_associate_certifications_associateId_certificationId_ex_key" ON "rel_associate_certifications"("associateId", "certificationId", "expiryDate", "isDeleted");
