-- ============================================================
-- A4.1-EVO FASE 1: Eventos como columna vertebral (evolución)
-- ADR-042 — zero data loss, zero breakage
-- ============================================================

-- 1. ALTER TABLE eventos — columnas universales nuevas
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES personas(id) ON DELETE SET NULL;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES personas(id) ON DELETE SET NULL;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS espacio_virtual_tipo TEXT
  CHECK (espacio_virtual_tipo IN ('zoom', 'meet', 'teams', 'discord', 'custom'));
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS espacio_virtual_link TEXT;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS recordatorios JSONB DEFAULT '[]'::jsonb;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS etiquetas TEXT[] DEFAULT '{}';

-- 2. Indexes para nuevas columnas
DROP INDEX IF EXISTS eventos_tenant_fecha;
CREATE INDEX IF NOT EXISTS idx_eventos_tenant_fecha_alive
  ON eventos(tenant_id, fecha DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_eventos_tenant_modulo_alive
  ON eventos(tenant_id, modulo_origen) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_eventos_created_by
  ON eventos(created_by) WHERE created_by IS NOT NULL AND deleted_at IS NULL;

-- 3. ALTER TABLE evento_invitados — estado invitación
ALTER TABLE evento_invitados
  ADD COLUMN IF NOT EXISTS estado_invitacion TEXT DEFAULT 'pendiente'
    CHECK (estado_invitacion IN ('pendiente', 'aceptada', 'rechazada', 'tentativa'));
ALTER TABLE evento_invitados
  ADD COLUMN IF NOT EXISTS respuesta_at TIMESTAMPTZ;

-- 4. RLS REWRITE — eliminar legacy equipos_horarios_* + crear nuevas
DROP POLICY IF EXISTS equipos_horarios_select ON eventos;
DROP POLICY IF EXISTS equipos_horarios_insert ON eventos;
DROP POLICY IF EXISTS equipos_horarios_update ON eventos;
DROP POLICY IF EXISTS equipos_horarios_delete ON eventos;

CREATE POLICY eventos_select ON eventos FOR SELECT
  USING (tenant_id = get_tenant_actual() AND deleted_at IS NULL);

CREATE POLICY eventos_insert ON eventos FOR INSERT
  WITH CHECK (
    tenant_id = get_tenant_actual()
    AND (
      es_admin_tenant()
      OR responsable_persona_id = get_persona_actual()
      OR instructor_principal_id = get_persona_actual()
    )
  );

CREATE POLICY eventos_update ON eventos FOR UPDATE
  USING (
    tenant_id = get_tenant_actual()
    AND deleted_at IS NULL
    AND (
      es_admin_tenant()
      OR responsable_persona_id = get_persona_actual()
      OR instructor_principal_id = get_persona_actual()
    )
  )
  WITH CHECK (tenant_id = get_tenant_actual());

CREATE POLICY eventos_delete ON eventos FOR DELETE
  USING (tenant_id = get_tenant_actual() AND es_admin_tenant());

-- 5. Rename legacy constraints
ALTER INDEX IF EXISTS equipos_horarios_pkey RENAME TO eventos_pkey;
ALTER TRIGGER equipos_horarios_set_updated_at ON eventos RENAME TO trg_eventos_set_updated_at;
ALTER TABLE eventos RENAME CONSTRAINT equipos_horarios_cancha_id_fkey TO eventos_cancha_id_fkey;
ALTER TABLE eventos RENAME CONSTRAINT equipos_horarios_equipo_id_fkey TO eventos_equipo_id_fkey;
ALTER TABLE eventos RENAME CONSTRAINT equipos_horarios_instructor_principal_id_fkey TO eventos_instructor_principal_id_fkey;
ALTER TABLE eventos RENAME CONSTRAINT equipos_horarios_sede_id_fkey TO eventos_sede_id_fkey;
ALTER TABLE eventos RENAME CONSTRAINT equipos_horarios_tenant_id_fkey TO eventos_tenant_id_fkey;
ALTER TABLE eventos RENAME CONSTRAINT equipos_horarios_dia_semana_check TO eventos_dia_semana_check;
