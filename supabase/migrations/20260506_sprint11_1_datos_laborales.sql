-- ============================================================================
-- SPRINT 11.1 — Datos laborales en persona + catálogos + cleanup contratos
-- Decisión: los datos laborales son de la PERSONA, no del contrato.
-- El contrato solo los lee.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Catálogos
-- ---------------------------------------------------------------------------

-- 1.1 catalogo_areas_trabajo
CREATE TABLE IF NOT EXISTS catalogo_areas_trabajo (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE catalogo_areas_trabajo ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_areas_trabajo_read ON catalogo_areas_trabajo FOR SELECT TO authenticated USING (true);

INSERT INTO catalogo_areas_trabajo (slug, nombre) VALUES
  ('administracion', 'Administración'),
  ('mantenimiento', 'Mantenimiento'),
  ('cocina', 'Cocina'),
  ('buffet', 'Buffet'),
  ('cancha', 'Cancha'),
  ('limpieza', 'Limpieza'),
  ('deportiva', 'Deportiva'),
  ('medica', 'Médica'),
  ('seguridad', 'Seguridad'),
  ('direccion', 'Dirección')
ON CONFLICT (slug) DO NOTHING;

-- 1.2 catalogo_puestos
CREATE TABLE IF NOT EXISTS catalogo_puestos (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE catalogo_puestos ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_puestos_read ON catalogo_puestos FOR SELECT TO authenticated USING (true);

-- Seed mínimo — el club carga los suyos
INSERT INTO catalogo_puestos (slug, nombre) VALUES
  ('director_tecnico', 'Director técnico'),
  ('preparador_fisico', 'Preparador físico'),
  ('kinesiologo', 'Kinesiólogo'),
  ('administrativo', 'Administrativo'),
  ('encargado_mantenimiento', 'Encargado de mantenimiento'),
  ('coordinador_deportivo', 'Coordinador deportivo'),
  ('recepcionista', 'Recepcionista'),
  ('seguridad', 'Seguridad'),
  ('cocinero', 'Cocinero'),
  ('mozo', 'Mozo')
ON CONFLICT (slug) DO NOTHING;

-- 1.3 catalogo_roles_laborales
CREATE TABLE IF NOT EXISTS catalogo_roles_laborales (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE catalogo_roles_laborales ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_roles_laborales_read ON catalogo_roles_laborales FOR SELECT TO authenticated USING (true);

INSERT INTO catalogo_roles_laborales (slug, nombre) VALUES
  ('titular', 'Titular'),
  ('suplente', 'Suplente'),
  ('encargado', 'Encargado'),
  ('supervisor', 'Supervisor'),
  ('asistente', 'Asistente'),
  ('pasante', 'Pasante')
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. personas_datos_laborales — 1:1 con persona
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS personas_datos_laborales (
  persona_id uuid PRIMARY KEY REFERENCES personas(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  area_trabajo_slug text REFERENCES catalogo_areas_trabajo(slug) ON DELETE SET NULL,
  puesto_slug text REFERENCES catalogo_puestos(slug) ON DELETE SET NULL,
  rol_laboral_slug text REFERENCES catalogo_roles_laborales(slug) ON DELETE SET NULL,
  numero_legajo text,
  obra_social_slug text REFERENCES catalogo_obras_sociales(slug) ON DELETE SET NULL,
  sindicato text,

  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Unique legajo por tenant
CREATE UNIQUE INDEX idx_personas_datos_laborales_legajo
  ON personas_datos_laborales(tenant_id, numero_legajo)
  WHERE numero_legajo IS NOT NULL;

CREATE INDEX idx_personas_datos_laborales_tenant ON personas_datos_laborales(tenant_id);

-- RLS
ALTER TABLE personas_datos_laborales ENABLE ROW LEVEL SECURITY;

CREATE POLICY personas_datos_laborales_select
  ON personas_datos_laborales FOR SELECT TO authenticated
  USING (tenant_id = get_tenant_actual());

CREATE POLICY personas_datos_laborales_insert
  ON personas_datos_laborales FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_tenant_actual() AND puede_operar_rrhh());

CREATE POLICY personas_datos_laborales_update
  ON personas_datos_laborales FOR UPDATE TO authenticated
  USING (tenant_id = get_tenant_actual() AND puede_operar_rrhh());

CREATE POLICY personas_datos_laborales_delete
  ON personas_datos_laborales FOR DELETE TO authenticated
  USING (tenant_id = get_tenant_actual() AND puede_operar_rrhh());

-- Empleado puede ver sus propios datos laborales
CREATE POLICY personas_datos_laborales_own
  ON personas_datos_laborales FOR SELECT TO authenticated
  USING (persona_id = get_persona_actual());

-- Trigger updated_at
CREATE TRIGGER personas_datos_laborales_set_updated_at
  BEFORE UPDATE ON personas_datos_laborales
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Drop columnas que ya no pertenecen a rrhh_contratos
-- ---------------------------------------------------------------------------
-- Primero migrar datos existentes (si hay) a personas_datos_laborales
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT ON (persona_id) persona_id, tenant_id, cuil, obra_social, sindicato, numero_legajo, area, puesto
    FROM rrhh_contratos
    WHERE deleted_at IS NULL
    ORDER BY persona_id, fecha_inicio DESC
  LOOP
    INSERT INTO personas_datos_laborales (persona_id, tenant_id, numero_legajo, sindicato)
    VALUES (
      r.persona_id,
      r.tenant_id,
      NULLIF(r.numero_legajo, ''),
      NULLIF(r.sindicato, '')
    )
    ON CONFLICT (persona_id) DO NOTHING;
  END LOOP;
END;
$$;

ALTER TABLE rrhh_contratos DROP COLUMN IF EXISTS cuil;
ALTER TABLE rrhh_contratos DROP COLUMN IF EXISTS obra_social;
ALTER TABLE rrhh_contratos DROP COLUMN IF EXISTS sindicato;
ALTER TABLE rrhh_contratos DROP COLUMN IF EXISTS numero_legajo;
ALTER TABLE rrhh_contratos DROP COLUMN IF EXISTS area;
ALTER TABLE rrhh_contratos DROP COLUMN IF EXISTS puesto;

-- ---------------------------------------------------------------------------
-- 4. Registrar catálogos en configuración (para ABM desde admin)
-- ---------------------------------------------------------------------------
-- No hay tabla registro de catálogos, se maneja en código.

COMMENT ON TABLE personas_datos_laborales IS 'Datos laborales 1:1 de la persona (área, puesto, legajo, obra social, sindicato). Se leen desde el contrato.';
COMMENT ON TABLE catalogo_areas_trabajo IS 'Catálogo de áreas de trabajo del club';
COMMENT ON TABLE catalogo_puestos IS 'Catálogo de puestos laborales';
COMMENT ON TABLE catalogo_roles_laborales IS 'Catálogo de roles laborales (titular, suplente, encargado, etc.)';
