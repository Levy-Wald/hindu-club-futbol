-- Migration: entidades_representantes
-- Sprint 6: Representantes de entidades externas
-- Tabla pivote persona-entidad con rol

CREATE TABLE IF NOT EXISTS entidades_representantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entidad_id uuid NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  rol text NOT NULL DEFAULT 'contacto'
    CHECK (rol IN ('presidente','vicepresidente','secretario','tesorero','vocal','contacto','delegado','otro')),
  rol_custom text, -- si rol='otro', nombre libre
  activo boolean NOT NULL DEFAULT true,
  fecha_inicio date DEFAULT CURRENT_DATE,
  fecha_fin date,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE (tenant_id, entidad_id, persona_id, rol)
);

CREATE INDEX idx_entidades_representantes_entidad ON entidades_representantes(entidad_id) WHERE activo = true;
CREATE INDEX idx_entidades_representantes_persona ON entidades_representantes(persona_id) WHERE activo = true;

-- RLS
ALTER TABLE entidades_representantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY entidades_representantes_tenant ON entidades_representantes
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT get_tenant_actual()))
  WITH CHECK (tenant_id = (SELECT get_tenant_actual()));

-- Trigger updated_at
CREATE TRIGGER trg_entidades_representantes_updated_at
  BEFORE UPDATE ON entidades_representantes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE entidades_representantes IS 'Representantes (personas) asignados a entidades externas con rol';
