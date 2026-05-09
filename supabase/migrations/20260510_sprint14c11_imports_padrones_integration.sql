-- Sprint 14c.1.1: Integración imports al flujo de padrones

-- 1.1 Columna padrones.pipeline_slug con FK compuesta
ALTER TABLE padrones ADD COLUMN IF NOT EXISTS pipeline_slug text;

ALTER TABLE padrones ADD CONSTRAINT padrones_pipeline_fk
  FOREIGN KEY (tenant_id, pipeline_slug)
  REFERENCES import_pipelines(tenant_id, slug)
  ON DELETE RESTRICT;

-- 1.2 Columna import_runs.padron_id (NOT NULL, 0 runs históricos)
ALTER TABLE import_runs ADD COLUMN padron_id uuid NOT NULL REFERENCES padrones(id);
CREATE INDEX import_runs_padron_idx ON import_runs(padron_id, fecha_inicio DESC);

-- 1.3 Reemplazar índice hash: de (tenant_id, hash) a (padron_id, hash)
DROP INDEX IF EXISTS idx_import_runs_hash_unique;
CREATE UNIQUE INDEX import_runs_padron_hash_unique
  ON import_runs(padron_id, hash_archivo)
  WHERE estado IN ('aplicado','revisando');

-- 1.4 Asignar pipeline al padrón existente
UPDATE padrones SET pipeline_slug = 'jugadores_por_equipo'
  WHERE id = '1da96e8a-8a5e-4b66-bdd3-474bf0ffa589';
