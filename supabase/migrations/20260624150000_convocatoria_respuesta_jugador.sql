-- F1 portal — Respuesta del jugador a la convocatoria (confirmar/rechazar/tentativa).
-- El DT/cuerpo técnico arma la convocatoria (estado titular/suplente/convocado);
-- el jugador responde su disponibilidad. Vocabulario alineado con evento_invitados
-- (pendiente/aceptado/rechazado/tentativa).

ALTER TABLE evento_convocados
  ADD COLUMN IF NOT EXISTS respuesta text NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS respuesta_at timestamptz,
  ADD COLUMN IF NOT EXISTS motivo_respuesta text;

ALTER TABLE evento_convocados DROP CONSTRAINT IF EXISTS evento_convocados_respuesta_check;
ALTER TABLE evento_convocados ADD CONSTRAINT evento_convocados_respuesta_check
  CHECK (respuesta = ANY (ARRAY['pendiente'::text, 'aceptado'::text, 'rechazado'::text, 'tentativa'::text]));

-- Tipos de notificación: convocatoria (DT→jugador), respuesta (jugador→DT),
-- mensaje directo (mensajería interna persona→persona).
INSERT INTO catalogo_tipos_notificacion (slug, nombre, categoria, prioridad_default, orden, activo)
VALUES
  ('convocatoria_recibida', 'Te convocaron a un partido', 'evento', 'alta', 105, true),
  ('convocatoria_respondida', 'Respuesta a convocatoria', 'evento', 'media', 106, true),
  ('mensaje_directo', 'Mensaje', 'comunicacion', 'media', 200, true)
ON CONFLICT (slug) DO NOTHING;
