-- AlterTable
ALTER TABLE "d_project_requirements" ADD COLUMN     "statusId" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "d_project_requirements" ADD CONSTRAINT "d_project_requirements_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "c_status_project_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
