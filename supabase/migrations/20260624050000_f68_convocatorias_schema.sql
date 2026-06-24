-- ============================================================================
-- F6.8 — Planificador de Partido (convocatoria). Por cada partido (evento con
-- tipo partido/amistoso y equipo), el cuerpo técnico arma la convocatoria desde
-- el plantel (personas_equipos): titular / suplente / convocado. Quien no figura
-- = no convocado. Vínculo con Partidos/Táctica vía evento_id + equipo.
--
-- Patrón canónico: RLS por tenant, updated_at trigger. Reversible (ADR-058).
-- ============================================================================

CREATE TABLE IF NOT EXISTS evento_convocados (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  evento_id   uuid NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  persona_id  uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  estado      text NOT NULL DEFAULT 'convocado'
                CHECK (estado IN ('titular','suplente','convocado')),
  dorsal      integer,
  posicion    text,
  notas       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_evento_convocado UNIQUE (evento_id, persona_id)
);
CREATE INDEX IF NOT EXISTS idx_evento_convocados_evento ON evento_convocados(evento_id);

ALTER TABLE evento_convocados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS evento_convocados_tenant ON evento_convocados;
CREATE POLICY evento_convocados_tenant ON evento_convocados
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT get_tenant_actual()))
  WITH CHECK (tenant_id = (SELECT get_tenant_actual()));

CREATE TRIGGER evento_convocados_set_updated_at BEFORE UPDATE ON evento_convocados
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- ============================================================================
-- ROLLBACK: DROP TABLE IF EXISTS evento_convocados CASCADE;
-- ============================================================================
