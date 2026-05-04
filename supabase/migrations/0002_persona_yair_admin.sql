-- =============================================================================
-- Migration 0002: Crear persona admin Yair Levy Wald
-- Fecha: 2026-05-04
-- Descripción: Inserta la persona Yair como admin del sistema.
--              Requiere que yair@levywald.com ya exista en auth.users
--              (primer login con magic link ya hecho).
-- =============================================================================

INSERT INTO personas (tenant_id, dni, nombre, apellido, email, fuente_origen, user_id)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'Yair',
  'Levy Wald',
  'yair@levywald.com',
  'manual',
  (SELECT id FROM auth.users WHERE email = 'yair@levywald.com' LIMIT 1)
)
ON CONFLICT DO NOTHING;

INSERT INTO personas_atributos (tenant_id, persona_id, atributo_slug)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM personas WHERE email = 'yair@levywald.com' LIMIT 1),
  'admin_sistema'
)
ON CONFLICT DO NOTHING;

INSERT INTO personas_atributos (tenant_id, persona_id, atributo_slug)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM personas WHERE email = 'yair@levywald.com' LIMIT 1),
  'admin_tenant'
)
ON CONFLICT DO NOTHING;
