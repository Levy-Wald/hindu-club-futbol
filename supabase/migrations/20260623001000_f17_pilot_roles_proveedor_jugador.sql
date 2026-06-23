-- ============================================================================
-- F1.7 incremental — PILOTO: seed de roles proveedor + jugador en actor_roles
-- ----------------------------------------------------------------------------
-- Bajo ADR-068 (frontera B): los roles de negocio se consolidan en actor_roles.
-- Aditivo + idempotente. NO borra atributos (coexistencia, ADR-068). Scope global
-- (sin disciplina/equipo/sede) para el piloto; el scope fino es enriquecimiento
-- posterior. NO toca personas/entidades/atributos.
--
-- También crea la vista canónica de lectura v_actores_roles (security_invoker,
-- respeta RLS multi-tenant) que es la "fuente única" que los módulos consultan.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Seed rol 'proveedor' — consolida las fuentes dispersas (ADR-068):
--    entidades.tipo='proveedor' + producto_proveedores(persona/entidad) +
--    personas_atributos('proveedor'). (concesionarios mapea a rol 'concesionario',
--    no a 'proveedor' -> excluido a propósito.)
-- ----------------------------------------------------------------------------
INSERT INTO actor_roles (tenant_id, actor_id, rol_slug)
SELECT DISTINCT a.tenant_id, a.id, 'proveedor'
FROM actores a
WHERE a.deleted_at IS NULL
  AND (
    (a.tipo_actor = 'entidad' AND a.entidad_id IN (SELECT id FROM entidades WHERE tipo = 'proveedor'))
    OR (a.tipo_actor = 'entidad' AND a.entidad_id IN (SELECT proveedor_entidad_id FROM producto_proveedores WHERE proveedor_entidad_id IS NOT NULL))
    OR (a.tipo_actor = 'persona' AND a.persona_id IN (SELECT proveedor_persona_id FROM producto_proveedores WHERE proveedor_persona_id IS NOT NULL))
    OR (a.tipo_actor = 'persona' AND a.persona_id IN (SELECT persona_id FROM personas_atributos WHERE atributo_slug = 'proveedor' AND activo = true))
  )
  AND NOT EXISTS (
    SELECT 1 FROM actor_roles ar
    WHERE ar.actor_id = a.id AND ar.rol_slug = 'proveedor'
      AND ar.disciplina_slug IS NULL AND ar.equipo_id IS NULL AND ar.sede_id IS NULL
  );

-- ----------------------------------------------------------------------------
-- 2) Seed rol 'jugador' — espeja el rol-atributo 'jugador' (ADR-068: migrar
--    role-attributes a actor_roles). Scope global; el link a equipo/disciplina
--    (desde personas_equipos) es enriquecimiento posterior.
-- ----------------------------------------------------------------------------
INSERT INTO actor_roles (tenant_id, actor_id, rol_slug)
SELECT a.tenant_id, a.id, 'jugador'
FROM actores a
JOIN personas_atributos pa
  ON pa.persona_id = a.persona_id AND pa.atributo_slug = 'jugador' AND pa.activo = true
WHERE a.tipo_actor = 'persona' AND a.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM actor_roles ar
    WHERE ar.actor_id = a.id AND ar.rol_slug = 'jugador'
      AND ar.disciplina_slug IS NULL AND ar.equipo_id IS NULL AND ar.sede_id IS NULL
  );

-- ----------------------------------------------------------------------------
-- 3) Vista canónica de lectura: v_actores_roles
--    Fuente única "qué es cada quién" (persona O entidad). security_invoker=true
--    => respeta las RLS de actor_roles/actores/personas/entidades (multi-tenant).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_actores_roles
WITH (security_invoker = true) AS
SELECT
  ar.id            AS actor_rol_id,
  ar.tenant_id,
  ar.rol_slug,
  cra.nombre       AS rol_nombre,
  cra.categoria    AS rol_categoria,
  a.id             AS actor_id,
  a.tipo_actor,
  a.persona_id,
  a.entidad_id,
  COALESCE(p.nombre || ' ' || p.apellido, e.nombre) AS actor_nombre,
  ar.fecha_inicio,
  ar.fecha_fin,
  ar.disciplina_slug,
  ar.equipo_id,
  ar.sede_id
FROM actor_roles ar
JOIN actores a              ON a.id = ar.actor_id AND a.deleted_at IS NULL
JOIN catalogo_roles_actor cra ON cra.slug = ar.rol_slug
LEFT JOIN personas p        ON p.id = a.persona_id
LEFT JOIN entidades e       ON e.id = a.entidad_id
WHERE ar.activo = true AND ar.deleted_at IS NULL;

COMMENT ON VIEW v_actores_roles IS 'F1.7: fuente única de lectura de roles de actor (persona+entidad). Los módulos filtran por rol_slug. security_invoker => respeta RLS.';

-- ============================================================================
-- ROLLBACK:
--   DROP VIEW IF EXISTS v_actores_roles;
--   DELETE FROM actor_roles WHERE rol_slug IN ('proveedor','jugador');
-- ============================================================================
