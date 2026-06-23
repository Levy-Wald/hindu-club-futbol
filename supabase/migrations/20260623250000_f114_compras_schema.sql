-- ============================================================================
-- F1.14 — Compras MVP: solicitud → orden de compra → recepción → factura
-- ----------------------------------------------------------------------------
-- Ciclo básico de compras SIN workflows complejos ni aprobaciones multinivel
-- (DoD SE1-T19). 6 tablas: solicitudes(+items), ordenes_compra(+items),
-- recepciones(+items). El proveedor es una entidad tipo='proveedor' (F1.13);
-- los productos salen de `productos` (PIM). El "registro de factura" son campos
-- simples sobre la OC.
--
-- Patrón canónico: RLS multi-tenant (tenant_id = get_tenant_actual()),
-- soft-delete (deleted_at), updated_at via trg_set_updated_at, numero correlativo
-- vía SEQUENCE (atómico). Reversible: ver bloque ROLLBACK al final (ADR-058).
--
-- Scope-out (documentado): el posteo a stock (producto_movimientos_stock exige
-- ubicación/espacio) queda para la integración con PIM/stock (F6). La recepción
-- registra cantidades recibidas y mueve el estado de la OC.
-- ============================================================================

-- Secuencias para numeración correlativa de documentos.
CREATE SEQUENCE IF NOT EXISTS seq_compras_solicitudes;
CREATE SEQUENCE IF NOT EXISTS seq_ordenes_compra;
CREATE SEQUENCE IF NOT EXISTS seq_compras_recepciones;

-- ----------------------------------------------------------------------------
-- 1) compras_solicitudes — requisición interna de compra.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compras_solicitudes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  numero                text NOT NULL DEFAULT ('SOL-' || lpad(nextval('seq_compras_solicitudes')::text, 6, '0')),
  solicitante_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  estado                text NOT NULL DEFAULT 'borrador'
                          CHECK (estado IN ('borrador','enviada','convertida','cancelada')),
  convertida_oc_id      uuid,  -- FK a ordenes_compra (se agrega más abajo)
  notas                 text,
  fecha                 date NOT NULL DEFAULT current_date,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz
);
CREATE INDEX IF NOT EXISTS idx_compras_solicitudes_tenant ON compras_solicitudes(tenant_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS compras_solicitud_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  solicitud_id  uuid NOT NULL REFERENCES compras_solicitudes(id) ON DELETE CASCADE,
  producto_id   uuid REFERENCES productos(id) ON DELETE SET NULL,
  descripcion   text NOT NULL,
  cantidad      numeric NOT NULL CHECK (cantidad > 0),
  notas         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_compras_solicitud_items_sol ON compras_solicitud_items(solicitud_id);

-- ----------------------------------------------------------------------------
-- 2) ordenes_compra — orden de compra emitida a un proveedor.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ordenes_compra (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  numero                  text NOT NULL DEFAULT ('OC-' || lpad(nextval('seq_ordenes_compra')::text, 6, '0')),
  proveedor_entidad_id    uuid NOT NULL REFERENCES entidades(id) ON DELETE RESTRICT,
  solicitud_id            uuid REFERENCES compras_solicitudes(id) ON DELETE SET NULL,
  estado                  text NOT NULL DEFAULT 'borrador'
                            CHECK (estado IN ('borrador','emitida','recibida_parcial','recibida_total','cancelada')),
  moneda                  text NOT NULL DEFAULT 'ARS',
  total                   numeric NOT NULL DEFAULT 0,
  notas                   text,
  fecha_emision           date,
  fecha_entrega_estimada  date,
  -- registro de factura (simple)
  factura_numero          text,
  factura_fecha           date,
  factura_total           numeric,
  factura_registrada_at   timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  deleted_at              timestamptz
);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_tenant ON ordenes_compra(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proveedor ON ordenes_compra(proveedor_entidad_id) WHERE deleted_at IS NULL;

-- FK diferida de la solicitud a su OC (ahora que ordenes_compra existe).
ALTER TABLE compras_solicitudes
  DROP CONSTRAINT IF EXISTS compras_solicitudes_convertida_oc_fk,
  ADD CONSTRAINT compras_solicitudes_convertida_oc_fk
  FOREIGN KEY (convertida_oc_id) REFERENCES ordenes_compra(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS oc_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  oc_id             uuid NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  producto_id       uuid REFERENCES productos(id) ON DELETE SET NULL,
  descripcion       text NOT NULL,
  cantidad          numeric NOT NULL CHECK (cantidad > 0),
  precio_unitario   numeric NOT NULL DEFAULT 0,
  cantidad_recibida numeric NOT NULL DEFAULT 0,
  subtotal          numeric GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_oc_items_oc ON oc_items(oc_id);

-- ----------------------------------------------------------------------------
-- 3) compras_recepciones — recepción (parcial o total) contra una OC.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compras_recepciones (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  numero                 text NOT NULL DEFAULT ('REC-' || lpad(nextval('seq_compras_recepciones')::text, 6, '0')),
  oc_id                  uuid NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  fecha                  date NOT NULL DEFAULT current_date,
  recibido_por_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  notas                  text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  deleted_at             timestamptz
);
CREATE INDEX IF NOT EXISTS idx_compras_recepciones_oc ON compras_recepciones(oc_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS compras_recepcion_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  recepcion_id      uuid NOT NULL REFERENCES compras_recepciones(id) ON DELETE CASCADE,
  oc_item_id        uuid NOT NULL REFERENCES oc_items(id) ON DELETE CASCADE,
  cantidad_recibida numeric NOT NULL CHECK (cantidad_recibida > 0),
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_compras_recepcion_items_rec ON compras_recepcion_items(recepcion_id);

-- ----------------------------------------------------------------------------
-- RLS: aislamiento por tenant (authenticated). El gating fino por rol
-- (Compras/Tesorería/Admin) se hace en la capa de app (capabilities).
-- ----------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'compras_solicitudes','compras_solicitud_items','ordenes_compra','oc_items',
    'compras_recepciones','compras_recepcion_items'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tenant', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (tenant_id = (SELECT get_tenant_actual())) WITH CHECK (tenant_id = (SELECT get_tenant_actual()))',
      t || '_tenant', t
    );
  END LOOP;
END $$;

-- updated_at en las cabeceras que lo tienen.
CREATE TRIGGER compras_solicitudes_set_updated_at BEFORE UPDATE ON compras_solicitudes
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER ordenes_compra_set_updated_at BEFORE UPDATE ON ordenes_compra
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- ============================================================================
-- ROLLBACK:
--   DROP TABLE IF EXISTS compras_recepcion_items, compras_recepciones, oc_items,
--     ordenes_compra, compras_solicitud_items, compras_solicitudes CASCADE;
--   DROP SEQUENCE IF EXISTS seq_compras_solicitudes, seq_ordenes_compra, seq_compras_recepciones;
-- ============================================================================
