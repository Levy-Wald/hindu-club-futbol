-- Sprint 14a: Sistema de sincronización de padrones
-- Tablas: padron_syncs, padron_sync_diffs
-- Columnas nuevas en personas_padrones
-- Atributos: padron.admin, padron.consulta

-- ============================================================
-- 1. Columnas nuevas en personas_padrones
-- ============================================================
ALTER TABLE personas_padrones
  ADD COLUMN IF NOT EXISTS categoria_club text,
  ADD COLUMN IF NOT EXISTS actividad_club text,
  ADD COLUMN IF NOT EXISTS fecha_ingreso_club date,
  ADD COLUMN IF NOT EXISTS estado_club text DEFAULT 'activo',
  ADD COLUMN IF NOT EXISTS notas_club text,
  ADD COLUMN IF NOT EXISTS ultimo_sync_id uuid;

-- ============================================================
-- 2. Tabla padron_syncs (auditoría de cada sincronización)
-- ============================================================
CREATE TABLE IF NOT EXISTS padron_syncs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  padron_id uuid NOT NULL REFERENCES padrones(id),
  archivo_origen text NOT NULL,
  archivo_url text,
  hash_archivo text NOT NULL,
  fecha_sync timestamptz NOT NULL DEFAULT now(),
  ejecutado_por_persona_id uuid REFERENCES personas(id),
  estado text NOT NULL DEFAULT 'preview' CHECK (estado IN ('preview','procesando','revisado','aplicado','rollback','fallado')),
  total_filas_archivo int NOT NULL DEFAULT 0,
  altas_count int NOT NULL DEFAULT 0,
  bajas_count int NOT NULL DEFAULT 0,
  cambios_count int NOT NULL DEFAULT 0,
  sin_cambios_count int NOT NULL DEFAULT 0,
  rechazados_count int NOT NULL DEFAULT 0,
  resumen jsonb NOT NULL DEFAULT '{}',
  error_mensaje text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_padron_syncs_tenant ON padron_syncs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_padron_syncs_padron ON padron_syncs(padron_id);
CREATE INDEX IF NOT EXISTS idx_padron_syncs_hash ON padron_syncs(hash_archivo);
CREATE INDEX IF NOT EXISTS idx_padron_syncs_estado ON padron_syncs(estado);

DROP TRIGGER IF EXISTS trg_set_updated_at ON padron_syncs;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON padron_syncs
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

ALTER TABLE padron_syncs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "padron_syncs_select" ON padron_syncs
  FOR SELECT USING (tenant_id = get_tenant_actual());

CREATE POLICY "padron_syncs_insert" ON padron_syncs
  FOR INSERT WITH CHECK (tenant_id = get_tenant_actual() AND es_admin_tenant());

CREATE POLICY "padron_syncs_update" ON padron_syncs
  FOR UPDATE USING (tenant_id = get_tenant_actual() AND es_admin_tenant());

-- ============================================================
-- 3. Tabla padron_sync_diffs (detalle de cambios por persona)
-- ============================================================
CREATE TABLE IF NOT EXISTS padron_sync_diffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_id uuid NOT NULL REFERENCES padron_syncs(id) ON DELETE CASCADE,
  persona_id uuid REFERENCES personas(id),
  tipo_cambio text NOT NULL CHECK (tipo_cambio IN ('alta','baja','modificacion','sin_cambios','rechazado')),
  dni_archivo text,
  nombre_archivo text,
  numero_socio_archivo text,
  categoria_archivo text,
  actividad_archivo text,
  datos_antes jsonb,
  datos_despues jsonb,
  motivo_rechazo text,
  aplicado boolean NOT NULL DEFAULT false,
  aplicado_at timestamptz,
  revisado_por_persona_id uuid REFERENCES personas(id),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_padron_sync_diffs_sync ON padron_sync_diffs(sync_id);
CREATE INDEX IF NOT EXISTS idx_padron_sync_diffs_persona ON padron_sync_diffs(persona_id);
CREATE INDEX IF NOT EXISTS idx_padron_sync_diffs_tipo ON padron_sync_diffs(tipo_cambio);
CREATE INDEX IF NOT EXISTS idx_padron_sync_diffs_dni ON padron_sync_diffs(dni_archivo);

ALTER TABLE padron_sync_diffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "padron_sync_diffs_select" ON padron_sync_diffs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM padron_syncs s WHERE s.id = sync_id AND s.tenant_id = get_tenant_actual())
  );

CREATE POLICY "padron_sync_diffs_insert" ON padron_sync_diffs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM padron_syncs s WHERE s.id = sync_id AND s.tenant_id = get_tenant_actual() AND es_admin_tenant())
  );

CREATE POLICY "padron_sync_diffs_update" ON padron_sync_diffs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM padron_syncs s WHERE s.id = sync_id AND s.tenant_id = get_tenant_actual() AND es_admin_tenant())
  );

-- ============================================================
-- 4. FK de personas_padrones.ultimo_sync_id
-- ============================================================
ALTER TABLE personas_padrones
  ADD CONSTRAINT fk_personas_padrones_ultimo_sync
  FOREIGN KEY (ultimo_sync_id) REFERENCES padron_syncs(id)
  ON DELETE SET NULL;

-- ============================================================
-- 5. Atributos padron.admin y padron.consulta
-- ============================================================
INSERT INTO catalogo_atributos (slug, nombre, descripcion, categoria)
VALUES
  ('padron.admin', 'Admin Padrones', 'Puede ejecutar sincronizaciones y aprobar cambios', 'sistema'),
  ('padron.consulta', 'Consulta Padrones', 'Solo puede ver historial de sincronizaciones', 'sistema')
ON CONFLICT (slug) DO NOTHING;
