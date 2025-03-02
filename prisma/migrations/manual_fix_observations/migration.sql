/*
-- Primero, añadimos la columna observations
ALTER TABLE "c_client_areas" ADD COLUMN "observations" TEXT;

-- Copiamos los datos de terms_and_conditions a observations
UPDATE "c_client_areas" SET "observations" = "terms_and_conditions";

-- Eliminamos la columna terms_and_conditions
ALTER TABLE "c_client_areas" DROP COLUMN "terms_and_conditions";
*/