/*
  Warnings:

  - You are about to drop the column `name` on the `d_users` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `d_users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "d_users" DROP COLUMN "name",
DROP COLUMN "phone";
