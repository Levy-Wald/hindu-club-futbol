-- ============================================================================
-- F1.7 incremental — scope de 'socio' por padrón (cierre del modelo de scope)
-- ----------------------------------------------------------------------------
-- actor_roles solo tenía scope disciplina/equipo/sede. El padrón es otra
-- dimensión de scope para 'socio' -> se agrega columna padron_id (igual criterio
-- que las otras: columna FK tipada, nullable). Decisión B (como jugador): se
-- mantiene el 'socio' GLOBAL (del atributo) y se agregan los SCOPED por padrón
-- desde personas_padrones (fuente operativa real). Aditivo + idempotente.
-- ============================================================================

-- 1) Nueva dimensión de scope: padron_id
ALTER TABLE actor_roles ADD COLUMN IF NOT EXISTS padron_id uuid REFERENCES padrones(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_actor_roles_padron ON actor_roles(padron_id) WHERE padron_id IS NOT NULL;

-- 2) Recrear el índice único de asignación incluyendo padron_id en el scope
DROP INDEX IF EXISTS ux_actor_roles_asignacion;
CREATE UNIQUE INDEX ux_actor_roles_asignacion ON actor_roles (
  tenant_id, actor_id, rol_slug,
  COALESCE(disciplina_slug, ''),
  COALESCE(equipo_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(sede_id,   '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(padron_id, '00000000-0000-0000-0000-000000000000'::uuid)
) WHERE activo = true AND deleted_at IS NULL;

-- 3) Vista canónica: exponer padron_id
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
  ar.sede_id,
  ar.padron_id
FROM actor_roles ar
JOIN actores a              ON a.id = ar.actor_id AND a.deleted_at IS NULL
JOIN catalogo_roles_actor cra ON cra.slug = ar.rol_slug
LEFT JOIN personas p        ON p.id = a.persona_id
LEFT JOIN entidades e       ON e.id = a.entidad_id
WHERE ar.activo = true AND ar.deleted_at IS NULL;

-- 4) Seed: 'socio' SCOPED por padrón desde personas_padrones (membresías activas).
--    El global (del atributo) ya existe y se mantiene (decisión B: ambos).
INSERT INTO actor_roles (tenant_id, actor_id, rol_slug, padron_id)
SELECT DISTINCT a.tenant_id, a.id, 'socio', pp.padron_id
FROM actores a
JOIN personas_padrones pp ON pp.persona_id = a.persona_id AND pp.activo = true
WHERE a.tipo_actor = 'persona' AND a.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM actor_roles ar
    WHERE ar.actor_id = a.id AND ar.rol_slug = 'socio' AND ar.padron_id = pp.padron_id
  );

-- ----------------------------------------------------------------------------
-- ROLLBACK:
--   DELETE FROM actor_roles WHERE rol_slug='socio' AND padron_id IS NOT NULL;
--   (la columna padron_id y el índice pueden quedar; para revertir del todo:
--    DROP INDEX ux_actor_roles_asignacion; recrear sin padron_id;
--    ALTER TABLE actor_roles DROP COLUMN padron_id;)
-- ============================================================================
