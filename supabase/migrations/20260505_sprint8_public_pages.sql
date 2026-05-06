-- Sprint 8: Páginas públicas + Branding + Pre-inscripción
-- Tablas: tenant_config_publica, pre_inscripciones
-- Aplicada a Supabase via MCP el 2026-05-05

-- 1. Configuración pública del tenant
CREATE TABLE IF NOT EXISTS tenant_config_publica (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url text,
  logo_dark_url text,
  favicon_url text,
  color_primario text DEFAULT '#3A8FC5',
  color_secundario text DEFAULT '#F2C531',
  nombre_display text,
  slogan text,
  descripcion text,
  email_contacto text,
  telefono text,
  whatsapp text,
  direccion text,
  mapa_url text,
  redes jsonb DEFAULT '{}',
  seo jsonb DEFAULT '{}',
  hero_titulo text,
  hero_bajada text,
  hero_imagen_url text,
  asociate_titulo text DEFAULT 'Sumate al club',
  asociate_bajada text DEFAULT 'Formá parte de nuestra familia deportiva',
  asociate_descripcion text,
  galeria jsonb DEFAULT '[]',
  videos jsonb DEFAULT '[]',
  pagina_publica_activa boolean DEFAULT true,
  mostrar_plantel boolean DEFAULT true,
  mostrar_calendario boolean DEFAULT false,
  mostrar_staff boolean DEFAULT true,
  pre_inscripcion_activa boolean DEFAULT true,
  mostrar_capitanes boolean DEFAULT true,
  terminos_condiciones text,
  politica_privacidad text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Pre-inscripciones
CREATE TABLE IF NOT EXISTS pre_inscripciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  apellido text NOT NULL,
  numero_documento text,
  tipo_documento text DEFAULT 'DNI',
  fecha_nacimiento date,
  email text,
  telefono text,
  sexo text,
  es_menor boolean DEFAULT false,
  tutor_nombre text,
  tutor_apellido text,
  tutor_telefono text,
  tutor_email text,
  tutor_documento text,
  tutor_vinculo text,
  disciplina_slug text,
  categoria_preferida text,
  equipo_id uuid REFERENCES equipos(id) ON DELETE SET NULL,
  experiencia_previa text,
  mensaje text,
  estado text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'en_revision', 'aprobada', 'rechazada', 'vencida')),
  motivo_rechazo text,
  persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES personas(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  origen text DEFAULT 'web',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referido_por text,
  acepta_terminos boolean NOT NULL DEFAULT false,
  acepta_comunicaciones boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pre_inscripciones_tenant_estado
  ON pre_inscripciones(tenant_id, estado);
CREATE INDEX IF NOT EXISTS idx_pre_inscripciones_created
  ON pre_inscripciones(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pre_inscripciones_documento
  ON pre_inscripciones(tenant_id, numero_documento)
  WHERE numero_documento IS NOT NULL;

-- Triggers
CREATE OR REPLACE TRIGGER trg_tenant_config_publica_updated_at
  BEFORE UPDATE ON tenant_config_publica
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE OR REPLACE TRIGGER trg_pre_inscripciones_updated_at
  BEFORE UPDATE ON pre_inscripciones
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- RLS
ALTER TABLE tenant_config_publica ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_inscripciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_config_publica_select_public" ON tenant_config_publica
  FOR SELECT USING (true);
CREATE POLICY "tenant_config_publica_all_authenticated" ON tenant_config_publica
  FOR ALL USING (tenant_id = (SELECT p.tenant_id FROM personas p WHERE p.user_id = auth.uid() LIMIT 1));

CREATE POLICY "pre_inscripciones_insert_anon" ON pre_inscripciones
  FOR INSERT WITH CHECK (true);
CREATE POLICY "pre_inscripciones_select_authenticated" ON pre_inscripciones
  FOR SELECT USING (tenant_id = (SELECT p.tenant_id FROM personas p WHERE p.user_id = auth.uid() LIMIT 1));
CREATE POLICY "pre_inscripciones_update_authenticated" ON pre_inscripciones
  FOR UPDATE USING (tenant_id = (SELECT p.tenant_id FROM personas p WHERE p.user_id = auth.uid() LIMIT 1));

-- Seed Hindu
INSERT INTO tenant_config_publica (
  tenant_id, nombre_display, slogan, descripcion,
  color_primario, color_secundario, logo_url,
  hero_titulo, hero_bajada, email_contacto, redes,
  pagina_publica_activa, pre_inscripcion_activa,
  asociate_titulo, asociate_bajada, asociate_descripcion
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Hindu Club Fútbol', 'Pasión, compromiso y valores',
  'Formamos jugadores y personas desde hace más de 50 años. Sumate a nuestra familia deportiva.',
  '#3A8FC5', '#F2C531', '/hindu-logo.png',
  'Hindu Club Fútbol', 'Pasión, compromiso y valores. Formamos jugadores y personas.',
  'futbol@hinduclub.com.ar', '{"instagram": "hinduclubfutbol"}',
  true, true,
  'Sumate al club', 'Formá parte de nuestra familia deportiva',
  'Tenemos categorías para todas las edades. Completá el formulario y nos ponemos en contacto.'
) ON CONFLICT (tenant_id) DO NOTHING;
