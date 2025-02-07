/*
  Warnings:

  - A unique constraint covering the columns `[email,isDeleted]` on the table `d_users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username,isDeleted]` on the table `d_users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "d_users_email_key";

-- DropIndex
DROP INDEX "d_users_username_key";

-- CreateIndex
CREATE UNIQUE INDEX "d_users_email_isDeleted_key" ON "d_users"("email", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "d_users_username_isDeleted_key" ON "d_users"("username", "isDeleted");
