-- Actualizar el nombre del privilegio de Asociados a Empresas
UPDATE "c_privileges"
SET name = 'Empresas'
WHERE name = 'Asociados';
