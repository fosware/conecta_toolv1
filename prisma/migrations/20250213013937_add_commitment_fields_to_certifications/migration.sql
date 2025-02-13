-- AlterTable
ALTER TABLE "r_company_certifications" ADD COLUMN     "commitmentDate" DATE,
ADD COLUMN     "isCommitment" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "expirationDate" DROP NOT NULL;
