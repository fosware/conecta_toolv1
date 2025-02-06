-- Insertar rol STAFF si no existe
INSERT INTO "c_roles" ("name", "prefix", "createdAt", "updatedAt")
SELECT 'STAFF', 'STAFF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "c_roles" WHERE "name" = 'STAFF'
);
