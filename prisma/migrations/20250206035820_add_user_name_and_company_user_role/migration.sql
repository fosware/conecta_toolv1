-- AlterTable
ALTER TABLE "d_users" ADD COLUMN     "name" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "r_company_users" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'STAFF';
