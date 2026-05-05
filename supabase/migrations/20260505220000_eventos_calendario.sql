-- Evolucionar equipos_horarios a sistema de eventos con fechas calendario
-- Los campos existentes (dia_semana, etc.) se mantienen para backward compat

ALTER TABLE equipos_horarios
  ADD COLUMN IF NOT EXISTS fecha date,
  ADD COLUMN IF NOT EXISTS titulo text,
  ADD COLUMN IF NOT EXISTS hora_citacion time,
  ADD COLUMN IF NOT EXISTS descripcion text;

COMMENT ON COLUMN equipos_horarios.fecha IS 'Fecha calendario del evento. Reemplaza dia_semana para eventos nuevos.';
COMMENT ON COLUMN equipos_horarios.titulo IS 'Titulo opcional del evento (ej: "Partido vs River").';
COMMENT ON COLUMN equipos_horarios.hora_citacion IS 'Hora de citacion previa al evento.';
COMMENT ON COLUMN equipos_horarios.descripcion IS 'Notas o descripcion adicional del evento.';

CREATE INDEX IF NOT EXISTS idx_equipos_horarios_fecha ON equipos_horarios(equipo_id, fecha) WHERE activo = true;
