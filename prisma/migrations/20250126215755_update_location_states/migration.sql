/*
  Warnings:

  - A unique constraint covering the columns `[name,country]` on the table `c_location_states` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "c_location_states_name_key";

-- AlterTable
ALTER TABLE "c_location_states" ALTER COLUMN "country" SET DEFAULT 'México';

-- CreateIndex
CREATE UNIQUE INDEX "c_location_states_name_country_key" ON "c_location_states"("name", "country");
