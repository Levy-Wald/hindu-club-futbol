-- ============================================================================
-- F1.3 — Reconciliación de drift: com_jobs_log + com_plantilla_versiones
-- ----------------------------------------------------------------------------
-- Estas 2 tablas existían en prod pero NO tenían archivo de migración en el repo
-- (drift; rompe reproducibilidad, ADR-058). Esta migración las documenta de forma
-- idempotente (IF NOT EXISTS) para que un build limpio las cree igual que en prod.
--
-- Bonus de correctitud: la policy de com_jobs_log en prod tenía el tenant
-- HARDCODEADO ('11111111-…' = DEFAULT_TENANT_ID, tech-debt). Acá se reescribe a
-- get_tenant_actual() (multi-tenant correcto, como el resto del esquema).
-- Aplicable a prod sin romper: las tablas ya existen (IF NOT EXISTS las saltea),
-- las policies se reemplazan (DROP IF EXISTS + CREATE).
-- ============================================================================

-- ── com_jobs_log: log de ejecución de jobs/triggers de comunicaciones ──
CREATE TABLE IF NOT EXISTS com_jobs_log (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_slug             text NOT NULL,
  status               text NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
  started_at           timestamptz NOT NULL DEFAULT now(),
  finished_at          timestamptz,
  personas_encontradas int NOT NULL DEFAULT 0,
  personas_notificadas int NOT NULL DEFAULT 0,
  personas_dedup       int NOT NULL DEFAULT 0,
  errores              int NOT NULL DEFAULT 0,
  metadata             jsonb DEFAULT '{}'::jsonb,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_com_jobs_log_tenant_job ON com_jobs_log(tenant_id, job_slug, created_at DESC);

ALTER TABLE com_jobs_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON com_jobs_log;
CREATE POLICY com_jobs_log_tenant ON com_jobs_log
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT get_tenant_actual()))
  WITH CHECK (tenant_id = (SELECT get_tenant_actual()));

-- ── com_plantilla_versiones: snapshots de versiones de plantillas ──
CREATE TABLE IF NOT EXISTS com_plantilla_versiones (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plantilla_id         uuid NOT NULL REFERENCES com_plantillas(id) ON DELETE CASCADE,
  version              int NOT NULL,
  subject              text,
  body_html            text,
  body_text            text,
  guardado_por_user_id uuid,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_com_plantilla_versiones_plantilla ON com_plantilla_versiones(plantilla_id, version DESC);

ALTER TABLE com_plantilla_versiones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS plantilla_versiones_via_plantilla ON com_plantilla_versiones;
CREATE POLICY com_plantilla_versiones_via_plantilla ON com_plantilla_versiones
  FOR ALL TO authenticated
  USING (plantilla_id IN (SELECT id FROM com_plantillas WHERE tenant_id = (SELECT get_tenant_actual())))
  WITH CHECK (plantilla_id IN (SELECT id FROM com_plantillas WHERE tenant_id = (SELECT get_tenant_actual())));

-- ============================================================================
-- ROLLBACK: no aplica (tablas preexistentes; las policies se podrían restaurar
-- a su versión anterior si hiciera falta, pero la nueva es estrictamente más
-- correcta — sin tenant hardcodeado).
-- ============================================================================
