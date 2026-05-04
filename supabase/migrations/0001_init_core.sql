-- =============================================================================
-- Migration 0001: Tablas core ClubCore
-- Proyecto: Hindu Club Fútbol V2
-- Fecha: 2026-05-04
-- Descripción: Crea todas las tablas core, catálogos, triggers y RLS básica
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3.1 tenants
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  nombre text NOT NULL,
  tipo text NOT NULL DEFAULT 'club' CHECK (tipo IN ('club','country','federacion','capitan_amateur','saas_cliente')),
  plan_slug text NOT NULL DEFAULT 'pro',
  activo boolean NOT NULL DEFAULT true,
  dominio_custom text,
  configuracion jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3.2 catalogo_atributos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalogo_atributos (
  slug text PRIMARY KEY,
  categoria text NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  builtin boolean DEFAULT false,
  tenant_id uuid REFERENCES tenants(id),
  valor_schema jsonb,
  permisos_default jsonb DEFAULT '[]'::jsonb,
  activo boolean DEFAULT true
);

-- ---------------------------------------------------------------------------
-- 3.3 catalogo_vinculos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalogo_vinculos (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  bidireccional boolean DEFAULT false,
  builtin boolean DEFAULT false,
  tenant_id uuid REFERENCES tenants(id)
);

-- ---------------------------------------------------------------------------
-- 3.4 catalogo_roles_equipo
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalogo_roles_equipo (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  categoria text NOT NULL,
  builtin boolean DEFAULT false,
  tenant_id uuid REFERENCES tenants(id),
  activo boolean DEFAULT true
);

-- ---------------------------------------------------------------------------
-- 3.5 catalogo_modulos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalogo_modulos (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  categoria text NOT NULL,
  dependencias text[] DEFAULT '{}',
  incompatibilidades text[] DEFAULT '{}',
  precio_usd_mensual numeric DEFAULT 0,
  disponible_en_planes text[] DEFAULT '{free,pro,enterprise}',
  beta boolean DEFAULT false,
  activo_global boolean DEFAULT true
);

-- ---------------------------------------------------------------------------
-- 3.6 tenant_modulos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  modulo_slug text NOT NULL REFERENCES catalogo_modulos(slug),
  activo boolean DEFAULT false,
  fecha_activacion timestamptz,
  fecha_desactivacion timestamptz,
  activado_por uuid,
  configuracion jsonb DEFAULT '{}'::jsonb,
  precio_pactado numeric,
  plan_incluido_en text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, modulo_slug)
);

-- ---------------------------------------------------------------------------
-- 3.7 personas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  dni text,
  tipo_documento text DEFAULT 'dni',
  nombre text NOT NULL,
  apellido text NOT NULL,
  fecha_nacimiento date,
  genero text,
  email text,
  email_secundario text,
  telefono text,
  whatsapp text,
  direccion jsonb,
  foto_url text,
  nacionalidad text,
  estado_civil text,
  profesion text,
  talles jsonb,
  datos_medicos jsonb,
  idiomas text[],
  redes_sociales jsonb,
  notas text,
  fuente_origen text NOT NULL DEFAULT 'manual',
  fuente_origen_id text,
  estado text DEFAULT 'activo',
  motivo_baja text,
  fecha_baja date,
  user_id uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid,
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS personas_tenant_dni_idx
  ON personas(tenant_id, dni) WHERE dni IS NOT NULL AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 3.8 personas_atributos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS personas_atributos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  persona_id uuid NOT NULL REFERENCES personas(id),
  atributo_slug text NOT NULL REFERENCES catalogo_atributos(slug),
  valor jsonb,
  activo boolean DEFAULT true,
  fecha_inicio date,
  fecha_fin date,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- 3.9 personas_vinculos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS personas_vinculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  persona_origen_id uuid NOT NULL REFERENCES personas(id),
  persona_destino_id uuid NOT NULL REFERENCES personas(id),
  tipo_vinculo_slug text NOT NULL REFERENCES catalogo_vinculos(slug),
  valor jsonb,
  activo boolean DEFAULT true,
  fecha_inicio date,
  fecha_fin date,
  notas text,
  created_at timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3.10 entidades
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  tipo text NOT NULL,
  nombre text NOT NULL,
  slug text,
  entidad_padre_id uuid REFERENCES entidades(id),
  sitio_web text,
  telefono text,
  email text,
  direccion jsonb,
  logo_url text,
  activo boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3.11 sedes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sedes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  nombre text NOT NULL,
  slug text,
  tipo text NOT NULL DEFAULT 'deportiva',
  direccion jsonb,
  telefono text,
  email text,
  horario_atencion jsonb,
  activa boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3.12 canchas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS canchas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  sede_id uuid NOT NULL REFERENCES sedes(id),
  nombre text NOT NULL,
  tipo text,
  superficie text,
  iluminada boolean DEFAULT false,
  techada boolean DEFAULT false,
  capacidad_jugadores int,
  capacidad_espectadores int,
  disponible_para_alquiler boolean DEFAULT false,
  activo boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- 3.13 categorias_equipo
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias_equipo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  disciplina_slug text NOT NULL,
  modalidad text NOT NULL,
  tipo_categoria text NOT NULL,
  valor text NOT NULL,
  nombre_display text NOT NULL,
  edad_min int,
  edad_max int,
  nivel_competencia_slug text,
  activo boolean DEFAULT true
);

-- ---------------------------------------------------------------------------
-- 3.14 equipos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  entidad_id uuid REFERENCES entidades(id),
  disciplina_slug text NOT NULL,
  categoria_id uuid REFERENCES categorias_equipo(id),
  modalidad text,
  nombre text NOT NULL,
  nivel_competencia_slug text,
  color_principal text,
  color_secundario text,
  foto_url text,
  escudo_url text,
  sede_principal_id uuid REFERENCES sedes(id),
  activo boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3.15 equipos_competencias
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipos_competencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  equipo_id uuid NOT NULL REFERENCES equipos(id),
  federacion_id uuid NOT NULL REFERENCES entidades(id),
  torneo_nombre text,
  categoria_externa text,
  numero_afiliacion text,
  fecha_alta date DEFAULT current_date,
  fecha_baja date,
  activo boolean DEFAULT true
);

-- ---------------------------------------------------------------------------
-- 3.16 equipos_horarios
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipos_horarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  equipo_id uuid NOT NULL REFERENCES equipos(id),
  dia_semana int NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
  hora_inicio time NOT NULL,
  hora_fin time NOT NULL,
  sede_id uuid REFERENCES sedes(id),
  cancha_id uuid REFERENCES canchas(id),
  tipo_actividad text NOT NULL DEFAULT 'entrenamiento',
  instructor_principal_id uuid REFERENCES personas(id),
  fecha_inicio_vigencia date DEFAULT current_date,
  fecha_fin_vigencia date,
  activo boolean DEFAULT true
);

-- ---------------------------------------------------------------------------
-- 3.17 personas_equipos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS personas_equipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  persona_id uuid NOT NULL REFERENCES personas(id),
  equipo_id uuid NOT NULL REFERENCES equipos(id),
  rol_equipo_slug text NOT NULL REFERENCES catalogo_roles_equipo(slug),
  dorsal int,
  posicion text,
  activo boolean DEFAULT true,
  fecha_inicio date DEFAULT current_date,
  fecha_fin date,
  notas text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3.18 padrones
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS padrones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  nombre text NOT NULL,
  slug text NOT NULL,
  tipo text NOT NULL DEFAULT 'deportivo',
  es_externo boolean DEFAULT false,
  fuente_externa text,
  disciplina_slug text,
  activo boolean DEFAULT true,
  configuracion jsonb DEFAULT '{}'::jsonb,
  UNIQUE(tenant_id, slug)
);

-- ---------------------------------------------------------------------------
-- 3.19 personas_padrones
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS personas_padrones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  persona_id uuid NOT NULL REFERENCES personas(id),
  padron_id uuid NOT NULL REFERENCES padrones(id),
  estado_slug text NOT NULL DEFAULT 'activo',
  tipo_socio_slug text,
  fecha_alta date DEFAULT current_date,
  fecha_baja date,
  motivo_baja text,
  numero_socio text,
  origen_alta text DEFAULT 'manual',
  fuente_externa_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(tenant_id, persona_id, padron_id)
);

-- ---------------------------------------------------------------------------
-- 3.20 audit_log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  timestamp timestamptz DEFAULT now(),
  actor_user_id uuid,
  actor_persona_id uuid,
  actor_origen text,
  actor_ip text,
  actor_user_agent text,
  accion text NOT NULL,
  entidad_tipo text NOT NULL,
  entidad_id uuid,
  cambios jsonb,
  api_key_id uuid,
  mcp_session_id uuid,
  request_id text,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS audit_log_tenant_timestamp_idx ON audit_log(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS audit_log_entidad_idx ON audit_log(entidad_tipo, entidad_id);

-- ---------------------------------------------------------------------------
-- 3.21 Triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_tenants
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TRIGGER set_updated_at_personas
  BEFORE UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- ---------------------------------------------------------------------------
-- 3.22 RLS
-- ---------------------------------------------------------------------------

-- Activar RLS en todas las tablas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_atributos ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_vinculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_roles_equipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas_atributos ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas_vinculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE entidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE canchas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_equipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos_competencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos_horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas_equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE padrones ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas_padrones ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Función helper para obtener tenant del usuario actual
CREATE OR REPLACE FUNCTION get_tenant_actual()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT tenant_id FROM personas
  WHERE user_id = auth.uid() AND deleted_at IS NULL
  LIMIT 1;
$$;

-- Catálogos: lectura pública para builtin, filtro por tenant para custom
CREATE POLICY catalogo_atributos_read ON catalogo_atributos
  FOR SELECT USING (builtin = true OR tenant_id = get_tenant_actual());

CREATE POLICY catalogo_vinculos_read ON catalogo_vinculos
  FOR SELECT USING (builtin = true OR tenant_id = get_tenant_actual());

CREATE POLICY catalogo_roles_equipo_read ON catalogo_roles_equipo
  FOR SELECT USING (builtin = true OR tenant_id = get_tenant_actual());

CREATE POLICY catalogo_modulos_read ON catalogo_modulos
  FOR SELECT USING (true);

-- Tenant: cada usuario solo ve su propio tenant
CREATE POLICY tenants_read ON tenants
  FOR SELECT USING (id = get_tenant_actual());

-- Tablas con tenant_id: aislamiento por tenant
CREATE POLICY tenant_modulos_tenant_isolation ON tenant_modulos
  FOR ALL USING (tenant_id = get_tenant_actual());

CREATE POLICY personas_tenant_isolation ON personas
  FOR ALL USING (tenant_id = get_tenant_actual());

CREATE POLICY personas_atributos_tenant_isolation ON personas_atributos
  FOR ALL USING (tenant_id = get_tenant_actual());

CREATE POLICY personas_vinculos_tenant_isolation ON personas_vinculos
  FOR ALL USING (tenant_id = get_tenant_actual());

CREATE POLICY entidades_tenant_isolation ON entidades
  FOR ALL USING (tenant_id = get_tenant_actual());

CREATE POLICY sedes_tenant_isolation ON sedes
  FOR ALL USING (tenant_id = get_tenant_actual());

CREATE POLICY canchas_tenant_isolation ON canchas
  FOR ALL USING (tenant_id = get_tenant_actual());

CREATE POLICY categorias_equipo_tenant_isolation ON categorias_equipo
  FOR ALL USING (tenant_id = get_tenant_actual());

CREATE POLICY equipos_tenant_isolation ON equipos
  FOR ALL USING (tenant_id = get_tenant_actual());

CREATE POLICY equipos_competencias_tenant_isolation ON equipos_competencias
  FOR ALL USING (tenant_id = get_tenant_actual());

CREATE POLICY equipos_horarios_tenant_isolation ON equipos_horarios
  FOR ALL USING (tenant_id = get_tenant_actual());

CREATE POLICY personas_equipos_tenant_isolation ON personas_equipos
  FOR ALL USING (tenant_id = get_tenant_actual());

CREATE POLICY padrones_tenant_isolation ON padrones
  FOR ALL USING (tenant_id = get_tenant_actual());

CREATE POLICY personas_padrones_tenant_isolation ON personas_padrones
  FOR ALL USING (tenant_id = get_tenant_actual());

CREATE POLICY audit_log_tenant_isolation ON audit_log
  FOR SELECT USING (tenant_id = get_tenant_actual());
