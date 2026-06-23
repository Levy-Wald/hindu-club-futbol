-- ============================================================================
-- F1.7 incremental — completar roles de negocio con uso real en actor_roles
-- ----------------------------------------------------------------------------
-- Agrega al catálogo + migra desde personas_atributos los roles de negocio
-- inequívocos que tienen uso (ADR-068). Los ambiguos (staff, admin_concesiones,
-- staff_*, dot-notation) NO se migran: quedan como atributos/permisos.
-- Aditivo + idempotente. Scope global (enriquecimiento posterior).
-- ============================================================================

-- 1) Alta de roles faltantes en el catálogo (idempotente)
INSERT INTO catalogo_roles_actor (slug, nombre, categoria, aplica_a_tipo, sensible, orden) VALUES
  ('suscriptor',               'Suscriptor',                  'institucional', 'persona', false, 140),
  ('capitan',                  'Capitán',                     'deportivo',     'persona', false, 150),
  ('dirigente',                'Dirigente',                   'institucional', 'persona', false, 160),
  ('comision_directiva',       'Comisión Directiva',          'institucional', 'persona', false, 170),
  ('representante_federacion', 'Representante de federación',  'externo',       'persona', false, 180)
ON CONFLICT (slug) DO NOTHING;

-- 2) Seed actor_roles desde el atributo homónimo (1:1, scope global)
INSERT INTO actor_roles (tenant_id, actor_id, rol_slug)
SELECT DISTINCT a.tenant_id, a.id, pa.atributo_slug
FROM actores a
JOIN personas_atributos pa
  ON pa.persona_id = a.persona_id
WHERE a.tipo_actor = 'persona' AND a.deleted_at IS NULL
  AND pa.atributo_slug IN ('suscriptor','capitan','dirigente','comision_directiva','representante_federacion')
  AND pa.activo = true
  AND NOT EXISTS (
    SELECT 1 FROM actor_roles ar
    WHERE ar.actor_id = a.id AND ar.rol_slug = pa.atributo_slug
      AND ar.disciplina_slug IS NULL AND ar.equipo_id IS NULL AND ar.sede_id IS NULL
  );

-- ----------------------------------------------------------------------------
-- ROLLBACK:
--   DELETE FROM actor_roles WHERE rol_slug IN ('suscriptor','capitan','dirigente','comision_directiva','representante_federacion');
--   DELETE FROM catalogo_roles_actor WHERE slug IN ('suscriptor','capitan','dirigente','comision_directiva','representante_federacion');
-- ============================================================================
