-- Sprint 14a.6: Agregar nombre_confianza a padron_sync_diffs
-- Indica la confianza del parseo del nombre (alta/media/baja)

ALTER TABLE padron_sync_diffs
ADD COLUMN IF NOT EXISTS nombre_confianza text DEFAULT NULL;

COMMENT ON COLUMN padron_sync_diffs.nombre_confianza IS 'Confianza del parseo nombre/apellido: alta (2 palabras), media (3 sin partícula), baja (4+ sin partícula)';
