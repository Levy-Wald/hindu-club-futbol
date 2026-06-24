-- ============================================================================
-- FIX (bug F1.4) — invitaciones a eventos no se podían aceptar/rechazar.
-- ----------------------------------------------------------------------------
-- El CHECK de evento_invitados.estado_invitacion permitía 'aceptada'/'rechazada'
-- (femenino), pero TODO el código del módulo eventos (actions, queries,
-- recordatorios, panel UI, calendario) usa 'aceptado'/'rechazado' (masculino).
-- Resultado: el UPDATE violaba el constraint → "No se pudo guardar" y ninguna
-- invitación se podía responder (todas quedaban en 'pendiente').
--
-- Fix de menor riesgo: alinear la DB al código (masculino). No hay datos en
-- femenino (todo 'pendiente') ni funciones/vistas SQL que dependan del valor.
-- ============================================================================

ALTER TABLE evento_invitados DROP CONSTRAINT IF EXISTS evento_invitados_estado_invitacion_check;
ALTER TABLE evento_invitados ADD CONSTRAINT evento_invitados_estado_invitacion_check
  CHECK (estado_invitacion = ANY (ARRAY['pendiente'::text, 'aceptado'::text, 'rechazado'::text, 'tentativa'::text]));

-- ROLLBACK:
--   ALTER TABLE evento_invitados DROP CONSTRAINT evento_invitados_estado_invitacion_check;
--   ALTER TABLE evento_invitados ADD CONSTRAINT evento_invitados_estado_invitacion_check
--     CHECK (estado_invitacion = ANY (ARRAY['pendiente','aceptada','rechazada','tentativa']));
