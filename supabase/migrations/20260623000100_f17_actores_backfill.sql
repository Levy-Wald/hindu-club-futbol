-- ============================================================================
-- F1.7 — Modelo Actor + Roles (RFC-007) — BACKFILL
-- ----------------------------------------------------------------------------
-- Crea 1 actor por cada persona viva y 1 por cada entidad viva. Idempotente
-- (WHERE NOT EXISTS + índices únicos parciales del schema). No toca personas
-- ni entidades. Separado del schema change por POSTGRES.md.
--
-- Criterio de cierre (RFC-007 §11):
--   count(actores tipo=persona) = count(personas vivas: deleted_at IS NULL)
--   count(actores tipo=entidad) = count(entidades vivas: activo = true)
-- Verificación al final (comentada; correr post-apply / Opus vía MCP).
-- ============================================================================

-- Persona-actores: una persona viva = un actor tipo 'persona'
INSERT INTO actores (tenant_id, tipo_actor, persona_id)
SELECT p.tenant_id, 'persona', p.id
FROM personas p
WHERE p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM actores a
    WHERE a.persona_id = p.id AND a.tenant_id = p.tenant_id
  );

-- Entidad-actores: una entidad viva = un actor tipo 'entidad'
-- (entidades usa `activo boolean`, no deleted_at)
INSERT INTO actores (tenant_id, tipo_actor, entidad_id)
SELECT e.tenant_id, 'entidad', e.id
FROM entidades e
WHERE e.activo = true
  AND NOT EXISTS (
    SELECT 1 FROM actores a
    WHERE a.entidad_id = e.id AND a.tenant_id = e.tenant_id
  );

-- ----------------------------------------------------------------------------
-- VERIFICACIÓN (correr manualmente / Opus vía MCP tras aplicar):
--
--   SELECT
--     (SELECT count(*) FROM actores WHERE tipo_actor='persona' AND deleted_at IS NULL) AS actores_persona,
--     (SELECT count(*) FROM personas WHERE deleted_at IS NULL)                          AS personas_vivas,
--     (SELECT count(*) FROM actores WHERE tipo_actor='entidad' AND deleted_at IS NULL) AS actores_entidad,
--     (SELECT count(*) FROM entidades WHERE activo = true)                              AS entidades_vivas;
--   -- esperado: actores_persona = personas_vivas  Y  actores_entidad = entidades_vivas
--
-- ROLLBACK del backfill (sin tocar el schema):
--   DELETE FROM actores;   -- vacía la tabla; el schema queda
-- ============================================================================
