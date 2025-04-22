-- CreateTable
CREATE TABLE "d_user_log_read_status" (
    "id" SERIAL NOT NULL,
    "logId" INTEGER NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_user_log_read_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "d_user_log_read_status_userId_isRead_idx" ON "d_user_log_read_status"("userId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "d_user_log_read_status_userId_logId_key" ON "d_user_log_read_status"("userId", "logId");

-- AddForeignKey
ALTER TABLE "d_user_log_read_status" ADD CONSTRAINT "d_user_log_read_status_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_user_log_read_status" ADD CONSTRAINT "d_user_log_read_status_logId_fkey" FOREIGN KEY ("logId") REFERENCES "d_project_request_company_status_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
