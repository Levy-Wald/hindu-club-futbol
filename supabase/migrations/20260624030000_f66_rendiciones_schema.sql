-- ============================================================================
-- F6.6 — Rendición de gastos. Una persona rinde gastos (con ítems) → se presenta
-- → se aprueba/rechaza → se liquida. Sin workflows complejos. Imputable a un
-- centro de costo. La liquidación real (movimiento de caja) es integración con
-- Finanzas/F5; acá se registra el estado.
--
-- Patrón canónico (igual que compras): RLS por tenant, soft-delete, numero
-- correlativo por secuencia, updated_at trigger. Reversible (ADR-058).
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS seq_rendiciones_gastos;

CREATE TABLE IF NOT EXISTS rendiciones_gastos (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  numero                  text NOT NULL DEFAULT ('REND-' || lpad(nextval('seq_rendiciones_gastos')::text, 6, '0')),
  solicitante_persona_id  uuid REFERENCES personas(id) ON DELETE SET NULL,
  centro_costo_id         uuid REFERENCES centros_costo(id) ON DELETE SET NULL,
  estado                  text NOT NULL DEFAULT 'borrador'
                            CHECK (estado IN ('borrador','presentada','aprobada','rechazada','liquidada')),
  total                   numeric NOT NULL DEFAULT 0,
  notas                   text,
  fecha                   date NOT NULL DEFAULT current_date,
  aprobada_por_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  aprobada_at             timestamptz,
  motivo_rechazo          text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  deleted_at              timestamptz
);
CREATE INDEX IF NOT EXISTS idx_rendiciones_tenant ON rendiciones_gastos(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rendiciones_solicitante ON rendiciones_gastos(solicitante_persona_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS rendicion_gasto_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rendicion_id     uuid NOT NULL REFERENCES rendiciones_gastos(id) ON DELETE CASCADE,
  descripcion      text NOT NULL,
  categoria        text,
  monto            numeric NOT NULL CHECK (monto > 0),
  comprobante_ref  text,
  fecha            date,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rendicion_items_rendicion ON rendicion_gasto_items(rendicion_id);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['rendiciones_gastos','rendicion_gasto_items'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tenant', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (tenant_id = (SELECT get_tenant_actual())) WITH CHECK (tenant_id = (SELECT get_tenant_actual()))',
      t || '_tenant', t
    );
  END LOOP;
END $$;

CREATE TRIGGER rendiciones_gastos_set_updated_at BEFORE UPDATE ON rendiciones_gastos
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- ============================================================================
-- ROLLBACK:
--   DROP TABLE IF EXISTS rendicion_gasto_items, rendiciones_gastos CASCADE;
--   DROP SEQUENCE IF EXISTS seq_rendiciones_gastos;
-- ============================================================================
