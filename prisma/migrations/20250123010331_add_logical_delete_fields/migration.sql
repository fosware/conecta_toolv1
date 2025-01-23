-- AlterTable
ALTER TABLE "c_scopes" ADD COLUMN     "dateDeleted" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "c_specialties" ADD COLUMN     "dateDeleted" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "c_subscopes" ADD COLUMN     "dateDeleted" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
