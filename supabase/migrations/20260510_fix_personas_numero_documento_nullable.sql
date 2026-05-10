-- Bug A: personas.numero_documento debe ser nullable
-- Hay personas reales sin DNI (refuerzos, invitados, menores sin cargar)
-- El UNIQUE constraint (tenant_id, tipo_documento, numero_documento) sigue intacto
-- NULLs no se consideran iguales en UNIQUE de Postgres

ALTER TABLE personas ALTER COLUMN numero_documento DROP NOT NULL;
