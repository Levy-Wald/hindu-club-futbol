-- =============================================================================
-- Migration 0002: Persona admin Yair Levy Wald + constraint idempotencia
-- Fecha: 2026-05-04
-- Descripción: Asegura que exista la persona admin del sistema.
--              Idempotente: si ya existe, no hace nada.
-- =============================================================================

-- Constraint para evitar duplicar atributos de la misma persona
ALTER TABLE personas_atributos
  ADD CONSTRAINT personas_atributos_unique_activo
  UNIQUE (tenant_id, persona_id, atributo_slug)
  ;
-- Si el constraint ya existe, Postgres dará error; para idempotencia real
-- se debería usar DO $$ BEGIN ... EXCEPTION ... END $$, pero en Supabase
-- migrations se corre una sola vez, así que está bien.

-- Persona Yair (idempotente via unique index personas_tenant_dni_idx no aplica
-- porque dni es NULL; usamos subquery guard)
INSERT INTO personas (tenant_id, dni, nombre, apellido, email, fuente_origen, user_id)
SELECT
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'Yair',
  'Levy Wald',
  'yair@levywald.com',
  'manual',
  (SELECT id FROM auth.users WHERE email = 'yair@levywald.com' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM personas WHERE email = 'yair@levywald.com' AND tenant_id = '11111111-1111-1111-1111-111111111111'
);

-- Atributos (idempotente via el nuevo unique constraint)
INSERT INTO personas_atributos (tenant_id, persona_id, atributo_slug)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM personas WHERE email = 'yair@levywald.com' AND tenant_id = '11111111-1111-1111-1111-111111111111' LIMIT 1),
  'admin_sistema'
)
ON CONFLICT ON CONSTRAINT personas_atributos_unique_activo DO NOTHING;

INSERT INTO personas_atributos (tenant_id, persona_id, atributo_slug)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM personas WHERE email = 'yair@levywald.com' AND tenant_id = '11111111-1111-1111-1111-111111111111' LIMIT 1),
  'admin_tenant'
)
ON CONFLICT ON CONSTRAINT personas_atributos_unique_activo DO NOTHING;
