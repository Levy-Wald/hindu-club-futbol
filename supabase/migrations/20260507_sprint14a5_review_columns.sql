-- Sprint 14a.5: Columnas de revisión en padron_sync_diffs
-- Permite revisar individualmente cada diff antes de aplicar

ALTER TABLE padron_sync_diffs
  ADD COLUMN IF NOT EXISTS estado_revision text NOT NULL DEFAULT 'pendiente'
    CHECK (estado_revision IN ('pendiente', 'aprobado', 'descartado', 'editado', 'pospuesto')),
  ADD COLUMN IF NOT EXISTS revisado_at timestamptz,
  ADD COLUMN IF NOT EXISTS razon_descarte text;
