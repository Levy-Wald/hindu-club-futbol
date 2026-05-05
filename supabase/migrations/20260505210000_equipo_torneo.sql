-- Migration: Agregar campo torneo a equipos
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS torneo text;
COMMENT ON COLUMN equipos.torneo IS 'Nombre del torneo en el que compite el equipo';
