-- DropForeignKey
ALTER TABLE "d_associates" DROP CONSTRAINT "d_associates_userId_fkey";

-- AlterTable
ALTER TABLE "d_associates" ADD COLUMN     "ndaFileName" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "d_associates" ADD CONSTRAINT "d_associates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
