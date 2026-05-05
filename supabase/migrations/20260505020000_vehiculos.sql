-- Migration: 20260505020000_vehiculos
-- Descripcion: Crea tabla personas_vehiculos para registrar vehiculos de personas del club.
-- Autor: ClubCore
-- Fecha: 2026-05-05

-- =============================================================================
-- Tabla: personas_vehiculos
-- =============================================================================

CREATE TABLE IF NOT EXISTS personas_vehiculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  persona_id uuid NOT NULL REFERENCES personas(id),
  marca text NOT NULL,
  modelo text NOT NULL,
  año integer,
  patente text,
  color text,
  tipo_vehiculo text DEFAULT 'auto'
    CHECK (tipo_vehiculo IN ('auto', 'moto', 'camioneta', 'otro')),
  compania_seguro text,
  numero_poliza text,
  vencimiento_seguro date,
  vencimiento_vtv date,
  activo boolean DEFAULT true,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

COMMENT ON TABLE personas_vehiculos IS 'Vehiculos registrados por personas del club. Multi-tenant.';

-- =============================================================================
-- Indices
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_personas_vehiculos_persona_id
  ON personas_vehiculos(persona_id);

CREATE INDEX IF NOT EXISTS idx_personas_vehiculos_tenant_id
  ON personas_vehiculos(tenant_id);

-- =============================================================================
-- Trigger: updated_at automatico
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at_personas_vehiculos ON personas_vehiculos;

CREATE TRIGGER trg_set_updated_at_personas_vehiculos
  BEFORE UPDATE ON personas_vehiculos
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE personas_vehiculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY personas_vehiculos_tenant_isolation
  ON personas_vehiculos
  FOR ALL
  USING (tenant_id = (SELECT get_tenant_actual()))
  WITH CHECK (tenant_id = (SELECT get_tenant_actual()));
