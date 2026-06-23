-- ============================================================================
-- F1.7 — Modelo Actor + Roles (RFC-007) — SCHEMA
-- ----------------------------------------------------------------------------
-- Crea el supertipo "actor" (persona XOR entidad) + catálogo de roles + tabla
-- declarativa de roles asignados (actor_roles). Aditivo: NO toca personas ni
-- entidades. El backfill 1:1 va en la migración siguiente (…000100_backfill).
--
-- Spec: docs/rfcs/RFC-007-modelo-actor-roles-capabilities.md (§5)
-- Patrón: troncal con RLS multi-tenant (get_tenant_actual / es_admin_tenant),
--         soft-delete (deleted_at), updated_at via trg_set_updated_at.
-- Reversible: ver bloque ROLLBACK al final (ADR-058).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) actores — supertipo. Un actor es UNA persona física XOR UNA entidad.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS actores (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo_actor  text NOT NULL CHECK (tipo_actor IN ('persona','entidad')),
  persona_id  uuid REFERENCES personas(id) ON DELETE CASCADE,
  entidad_id  uuid REFERENCES entidades(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  deleted_at  timestamptz,
  metadata    jsonb DEFAULT '{}'::jsonb,
  -- XOR: exactamente uno de persona_id/entidad_id según tipo_actor
  CONSTRAINT actores_xor_persona_entidad CHECK (
    (tipo_actor = 'persona' AND persona_id IS NOT NULL AND entidad_id IS NULL)
    OR
    (tipo_actor = 'entidad' AND entidad_id IS NOT NULL AND persona_id IS NULL)
  )
);

COMMENT ON TABLE actores IS 'RFC-007: supertipo sobre personas/entidades. 1 actor = 1 persona XOR 1 entidad. No duplica dato: apunta al registro canónico.';

-- Un actor por persona y un actor por entidad (idempotencia del backfill).
CREATE UNIQUE INDEX IF NOT EXISTS ux_actores_persona ON actores(tenant_id, persona_id) WHERE persona_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_actores_entidad ON actores(tenant_id, entidad_id) WHERE entidad_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_actores_tenant ON actores(tenant_id) WHERE deleted_at IS NULL;

ALTER TABLE actores ENABLE ROW LEVEL SECURITY;

CREATE POLICY actores_select_tenant ON actores FOR SELECT TO authenticated
  USING (tenant_id = (SELECT get_tenant_actual()));
CREATE POLICY actores_insert_admin ON actores FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT get_tenant_actual()) AND (SELECT es_admin_tenant()));
CREATE POLICY actores_update_admin ON actores FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT get_tenant_actual()) AND (SELECT es_admin_tenant()))
  WITH CHECK (tenant_id = (SELECT get_tenant_actual()) AND (SELECT es_admin_tenant()));
CREATE POLICY actores_delete_admin ON actores FOR DELETE TO authenticated
  USING (tenant_id = (SELECT get_tenant_actual()) AND (SELECT es_admin_tenant()));

CREATE TRIGGER actores_set_updated_at BEFORE UPDATE ON actores
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- ----------------------------------------------------------------------------
-- 2) catalogo_roles_actor — catálogo GLOBAL del producto (sin tenant_id).
--    Lectura para todo autenticado; escritura solo service-role/admin SCL
--    (sin policy de write => RLS bloquea a authenticated, service_role saltea).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalogo_roles_actor (
  slug          text PRIMARY KEY,
  nombre        text NOT NULL,
  categoria     text CHECK (categoria IN ('deportivo','institucional','comercial','laboral','externo')),
  aplica_a_tipo text NOT NULL DEFAULT 'ambos' CHECK (aplica_a_tipo IN ('persona','entidad','ambos')),
  sensible      boolean NOT NULL DEFAULT false,
  activo        boolean NOT NULL DEFAULT true,
  orden         int DEFAULT 0,
  metadata      jsonb DEFAULT '{}'::jsonb,
  created_at    timestamptz DEFAULT now()
);

COMMENT ON TABLE catalogo_roles_actor IS 'RFC-007: catálogo global de roles posibles de un actor. Catálogo de producto, no por tenant.';

ALTER TABLE catalogo_roles_actor ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_roles_actor_read ON catalogo_roles_actor FOR SELECT TO authenticated USING (true);

-- Seed inicial (idempotente). Roles base CCBP.
INSERT INTO catalogo_roles_actor (slug, nombre, categoria, aplica_a_tipo, sensible, orden) VALUES
  ('socio',         'Socio',         'institucional', 'persona', false, 10),
  ('jugador',       'Jugador',       'deportivo',     'persona', false, 20),
  ('dt',            'Director técnico','deportivo',   'persona', false, 30),
  ('entrenador',    'Entrenador',    'deportivo',     'persona', false, 40),
  ('arbitro',       'Árbitro',       'deportivo',     'persona', false, 50),
  ('empleado',      'Empleado',      'laboral',       'persona', true,  60),
  ('proveedor',     'Proveedor',     'comercial',     'ambos',   false, 70),
  ('concesionario', 'Concesionario', 'comercial',     'ambos',   false, 80),
  ('federacion',    'Federación',    'externo',       'entidad', false, 90),
  ('sponsor',       'Sponsor',       'comercial',     'entidad', false, 100),
  ('tutor',         'Tutor',         'institucional', 'persona', false, 110),
  ('alumno',        'Alumno',        'institucional', 'persona', false, 120),
  ('prospecto',     'Prospecto',     'comercial',     'ambos',   false, 130)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3) actor_roles — asignación declarativa de roles a un actor (el corazón).
--    Reemplaza la inferencia dispersa de "qué es cada quién".
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS actor_roles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id        uuid NOT NULL REFERENCES actores(id) ON DELETE CASCADE,
  rol_slug        text NOT NULL REFERENCES catalogo_roles_actor(slug),
  -- vigencia
  fecha_inicio    date DEFAULT CURRENT_DATE,
  fecha_fin       date,
  -- alcance/scope (un rol puede ser global o acotado)
  disciplina_slug text REFERENCES catalogo_disciplinas(slug),
  equipo_id       uuid REFERENCES equipos(id) ON DELETE CASCADE,
  sede_id         uuid REFERENCES sedes(id) ON DELETE CASCADE,
  activo          boolean NOT NULL DEFAULT true,
  notas           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  deleted_at      timestamptz,
  metadata        jsonb DEFAULT '{}'::jsonb
);

COMMENT ON TABLE actor_roles IS 'RFC-007: fuente única de verdad de los roles de un actor, con vigencia y alcance (disciplina/equipo/sede).';

-- Una asignación activa única por (actor, rol, scope). NULL scope = rol global.
CREATE UNIQUE INDEX IF NOT EXISTS ux_actor_roles_asignacion ON actor_roles (
  tenant_id, actor_id, rol_slug,
  COALESCE(disciplina_slug, ''),
  COALESCE(equipo_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(sede_id,   '00000000-0000-0000-0000-000000000000'::uuid)
) WHERE activo = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_actor_roles_actor ON actor_roles(actor_id) WHERE activo = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_actor_roles_rol   ON actor_roles(rol_slug) WHERE activo = true AND deleted_at IS NULL;

ALTER TABLE actor_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY actor_roles_select_tenant ON actor_roles FOR SELECT TO authenticated
  USING (tenant_id = (SELECT get_tenant_actual()));
CREATE POLICY actor_roles_insert_admin ON actor_roles FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT get_tenant_actual()) AND (SELECT es_admin_tenant()));
CREATE POLICY actor_roles_update_admin ON actor_roles FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT get_tenant_actual()) AND (SELECT es_admin_tenant()))
  WITH CHECK (tenant_id = (SELECT get_tenant_actual()) AND (SELECT es_admin_tenant()));
CREATE POLICY actor_roles_delete_admin ON actor_roles FOR DELETE TO authenticated
  USING (tenant_id = (SELECT get_tenant_actual()) AND (SELECT es_admin_tenant()));

CREATE TRIGGER actor_roles_set_updated_at BEFORE UPDATE ON actor_roles
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- ============================================================================
-- ROLLBACK (ADR-058) — ejecutar en orden inverso de dependencias:
--   DROP TABLE IF EXISTS actor_roles;
--   DROP TABLE IF EXISTS catalogo_roles_actor;
--   DROP TABLE IF EXISTS actores;
-- (los triggers/policies/índices caen con la tabla)
-- ============================================================================
