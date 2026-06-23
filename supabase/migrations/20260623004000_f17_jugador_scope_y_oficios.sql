-- ============================================================================
-- F1.7 incremental — scope de jugador (decisión B: ambos) + oficios (decisión C)
-- ----------------------------------------------------------------------------
-- B (Yair): mantener el rol 'jugador' GLOBAL (165, del atributo) Y agregar los
--    SCOPED por equipo/disciplina desde personas_equipos (roster real, 202 filas).
-- C (Yair): oficios -> rol; accesos -> permiso. staff_medico->rol 'medico',
--    staff_utileria->rol 'utilero'. admin_concesiones / staff_acceso_total_salud /
--    dot-notation / 'staff' genérico QUEDAN como atributos/permisos (ADR-068).
-- Aditivo + idempotente.
-- ============================================================================

-- 1) Catálogo: alta de los oficios como roles
INSERT INTO catalogo_roles_actor (slug, nombre, categoria, aplica_a_tipo, sensible, orden) VALUES
  ('medico',  'Médico',  'deportivo', 'persona', false, 190),
  ('utilero', 'Utilero', 'deportivo', 'persona', false, 200)
ON CONFLICT (slug) DO NOTHING;

-- 2) jugador SCOPED desde el roster real (equipo_id + disciplina del equipo).
--    El global (165) ya existe y se mantiene (decisión B: ambos).
INSERT INTO actor_roles (tenant_id, actor_id, rol_slug, equipo_id, disciplina_slug)
SELECT DISTINCT a.tenant_id, a.id, 'jugador', pe.equipo_id, e.disciplina_slug
FROM actores a
JOIN personas_equipos pe ON pe.persona_id = a.persona_id AND pe.rol_equipo_slug = 'jugador'
JOIN equipos e           ON e.id = pe.equipo_id
WHERE a.tipo_actor = 'persona' AND a.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM actor_roles ar
    WHERE ar.actor_id = a.id AND ar.rol_slug = 'jugador'
      AND ar.equipo_id = pe.equipo_id
  );

-- 3) Oficios: seed 'medico' y 'utilero' desde sus atributos (scope global)
INSERT INTO actor_roles (tenant_id, actor_id, rol_slug)
SELECT DISTINCT a.tenant_id, a.id,
       CASE pa.atributo_slug WHEN 'staff_medico' THEN 'medico' WHEN 'staff_utileria' THEN 'utilero' END
FROM actores a
JOIN personas_atributos pa ON pa.persona_id = a.persona_id
WHERE a.tipo_actor = 'persona' AND a.deleted_at IS NULL
  AND pa.atributo_slug IN ('staff_medico','staff_utileria') AND pa.activo = true
  AND NOT EXISTS (
    SELECT 1 FROM actor_roles ar
    WHERE ar.actor_id = a.id
      AND ar.rol_slug = CASE pa.atributo_slug WHEN 'staff_medico' THEN 'medico' WHEN 'staff_utileria' THEN 'utilero' END
      AND ar.disciplina_slug IS NULL AND ar.equipo_id IS NULL AND ar.sede_id IS NULL
  );

-- ----------------------------------------------------------------------------
-- ROLLBACK:
--   DELETE FROM actor_roles WHERE rol_slug='jugador' AND equipo_id IS NOT NULL;  -- solo los scoped
--   DELETE FROM actor_roles WHERE rol_slug IN ('medico','utilero');
--   DELETE FROM catalogo_roles_actor WHERE slug IN ('medico','utilero');
-- ============================================================================
