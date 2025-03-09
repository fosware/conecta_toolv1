-- AlterTable
ALTER TABLE "d_project_requests" ADD COLUMN     "statusId" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "d_status_project_requests" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_status_project_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "d_status_project_requests_name_key" ON "d_status_project_requests"("name");

-- CreateIndex
CREATE INDEX "d_status_project_requests_isDeleted_isActive_idx" ON "d_status_project_requests"("isDeleted", "isActive");

-- AddForeignKey
ALTER TABLE "d_status_project_requests" ADD CONSTRAINT "d_status_project_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_requests" ADD CONSTRAINT "d_project_requests_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "d_status_project_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
