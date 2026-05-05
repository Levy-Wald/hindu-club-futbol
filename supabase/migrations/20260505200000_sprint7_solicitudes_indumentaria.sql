-- Migration: Sprint 7 — Solicitudes + Indumentaria + Vehiculos heredados + Storage
-- Tabla solicitudes (ingreso equipo, cambio datos)
-- Indumentaria en equipos (jsonb)
-- Propietario vehiculos heredados
-- Storage buckets

-- =============================================================================
-- 1. Tabla solicitudes
-- =============================================================================
CREATE TABLE IF NOT EXISTS solicitudes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  tipo text NOT NULL CHECK (tipo IN ('ingreso_equipo', 'cambio_datos')),
  solicitante_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),

  -- Datos de la solicitud (flexible por tipo)
  datos jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- ingreso_equipo: { equipo_id, rol_solicitado, mensaje }
  -- cambio_datos:   { campo, valor_actual, valor_nuevo }

  revisado_por uuid REFERENCES personas(id) ON DELETE SET NULL,
  revisado_at timestamptz,
  motivo_rechazo text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_solicitudes_tenant_estado ON solicitudes(tenant_id, estado) WHERE estado = 'pendiente';
CREATE INDEX idx_solicitudes_solicitante ON solicitudes(solicitante_id);

ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;

CREATE POLICY solicitudes_tenant ON solicitudes
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT get_tenant_actual()))
  WITH CHECK (tenant_id = (SELECT get_tenant_actual()));

CREATE TRIGGER trg_solicitudes_updated_at
  BEFORE UPDATE ON solicitudes
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

COMMENT ON TABLE solicitudes IS 'Solicitudes de ingreso a equipo y cambio de datos sensibles. Admin aprueba/rechaza.';

-- =============================================================================
-- 2. Indumentaria en equipos (jsonb con tipos de camiseta + foto)
-- =============================================================================
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS indumentaria jsonb DEFAULT '{}'::jsonb;
-- Estructura esperada:
-- {
--   "titular": { "descripcion": "Roja con blanca", "foto_url": "..." },
--   "suplente": { "descripcion": "Blanca", "foto_url": "..." },
--   "arquero_titular": { ... },
--   "arquero_suplente": { ... },
--   "dia_club": { ... },
--   "dia_visitante": { ... }
-- }

ALTER TABLE equipos ADD COLUMN IF NOT EXISTS foto_equipo_url text;

COMMENT ON COLUMN equipos.indumentaria IS 'Camisetas del equipo por tipo: titular, suplente, arquero_titular, arquero_suplente, dia_club, dia_visitante';
COMMENT ON COLUMN equipos.foto_equipo_url IS 'Foto grupal del equipo';

-- =============================================================================
-- 3. Vehiculos heredados: propietario_id para herencia padre->hijo
-- =============================================================================
ALTER TABLE personas_vehiculos ADD COLUMN IF NOT EXISTS propietario_id uuid REFERENCES personas(id) ON DELETE SET NULL;

COMMENT ON COLUMN personas_vehiculos.propietario_id IS 'Si es vehiculo familiar heredado, apunta al padre/tutor dueño real';

-- =============================================================================
-- 4. Storage buckets
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('public-assets', 'public-assets', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('private-documentos', 'private-documentos', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('private-fotos-personales', 'private-fotos-personales', false, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('private-comprobantes', 'private-comprobantes', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- RLS para public-assets (lectura publica, escritura autenticados)
CREATE POLICY public_assets_read ON storage.objects FOR SELECT
  USING (bucket_id = 'public-assets');

CREATE POLICY public_assets_write ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'public-assets');

-- RLS para buckets privados (solo autenticados del tenant)
CREATE POLICY private_docs_all ON storage.objects FOR ALL TO authenticated
  USING (bucket_id IN ('private-documentos', 'private-fotos-personales', 'private-comprobantes'))
  WITH CHECK (bucket_id IN ('private-documentos', 'private-fotos-personales', 'private-comprobantes'));

-- =============================================================================
-- 5. Estado 'inactivo' en catalogo si no existe
-- =============================================================================
INSERT INTO catalogo_estados_persona (slug, nombre)
VALUES ('inactivo', 'Inactivo')
ON CONFLICT (slug) DO NOTHING;
