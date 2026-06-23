-- ============================================================================
-- F1.7 incremental — seed rol 'socio' en actor_roles (rol pesado)
-- ----------------------------------------------------------------------------
-- Consolida los dos atributos de socio (socio_padron=2347, socio=1) en un único
-- rol de negocio 'socio' (ADR-068). Scope global (el scope por padrón es
-- enriquecimiento posterior; actor_roles hoy no tiene columna padron).
-- Aditivo + idempotente. NO borra atributos (coexistencia, ADR-068).
-- v_actores_roles ya expone este rol automáticamente.
-- ============================================================================

INSERT INTO actor_roles (tenant_id, actor_id, rol_slug)
SELECT DISTINCT a.tenant_id, a.id, 'socio'
FROM actores a
JOIN personas_atributos pa
  ON pa.persona_id = a.persona_id
WHERE a.tipo_actor = 'persona' AND a.deleted_at IS NULL
  AND pa.atributo_slug IN ('socio', 'socio_padron') AND pa.activo = true
  AND NOT EXISTS (
    SELECT 1 FROM actor_roles ar
    WHERE ar.actor_id = a.id AND ar.rol_slug = 'socio'
      AND ar.disciplina_slug IS NULL AND ar.equipo_id IS NULL AND ar.sede_id IS NULL
  );

-- ----------------------------------------------------------------------------
-- VERIFICACIÓN (correr tras aplicar):
--   SELECT
--     (SELECT count(*) FROM actor_roles WHERE rol_slug='socio') AS actor_roles_socio,
--     (SELECT count(DISTINCT pa.persona_id)
--      FROM personas_atributos pa JOIN actores a ON a.persona_id = pa.persona_id
--      WHERE pa.atributo_slug IN ('socio','socio_padron') AND pa.activo=true
--        AND a.tipo_actor='persona' AND a.deleted_at IS NULL) AS fuente_distinct;
--   -- esperado: actor_roles_socio = fuente_distinct
--
-- ROLLBACK:  DELETE FROM actor_roles WHERE rol_slug='socio';
-- ============================================================================
