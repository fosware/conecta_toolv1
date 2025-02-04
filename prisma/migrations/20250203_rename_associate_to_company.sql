-- Renombrar tablas
ALTER TABLE "d_associates" RENAME TO "d_companies";
ALTER TABLE "rel_associate_certifications" RENAME TO "r_company_certifications";
ALTER TABLE "rel_associate_specialties" RENAME TO "r_company_specialties";

-- Renombrar columnas en r_company_certifications
ALTER TABLE "r_company_certifications" RENAME COLUMN "associateId" TO "companyId";

-- Renombrar columnas en r_company_specialties
ALTER TABLE "r_company_specialties" RENAME COLUMN "associateId" TO "companyId";
ALTER TABLE "r_company_specialties" RENAME COLUMN "subscopeId" TO "subscope";

-- Actualizar secuencias si es necesario
ALTER SEQUENCE "d_associates_id_seq" RENAME TO "d_companies_id_seq";
ALTER SEQUENCE "rel_associate_certifications_id_seq" RENAME TO "r_company_certifications_id_seq";
ALTER SEQUENCE "rel_associate_specialties_id_seq" RENAME TO "r_company_specialties_id_seq";

-- Actualizar restricciones de clave foránea
ALTER TABLE "r_company_certifications" 
  DROP CONSTRAINT IF EXISTS "rel_associate_certifications_associateId_fkey",
  ADD CONSTRAINT "r_company_certifications_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "d_companies"("id");

ALTER TABLE "r_company_specialties" 
  DROP CONSTRAINT IF EXISTS "rel_associate_specialties_associateId_fkey",
  ADD CONSTRAINT "r_company_specialties_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "d_companies"("id");
