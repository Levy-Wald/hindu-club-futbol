-- F1.5 housekeeping (SE1-I3): completar capa NULL en catalogo_modulos
--
-- Root cause: la migración 20260518_b12_3_fix_capa_nombres_completos.sql mapeó
-- las capas de los verticals nuevos (arquitectura/abogacia/publicidad) pero NO
-- mapeó los valores viejos 'disciplina' y 'vertical' del init
-- (20260504220000_clubcore_init.sql, sección 12.17), que insertó estos 9 slugs
-- sin columna `capa` → quedaron en NULL.
--
-- vertical_ccbp ya es un valor válido del set de capas (no se toca el CHECK).
-- Idempotente: el guard `capa IS NULL` lo vuelve no-op si ya está seteado.

UPDATE catalogo_modulos
SET capa = 'vertical_ccbp'
WHERE slug IN (
  'disciplina_basquet',
  'disciplina_futbol',
  'disciplina_golf',
  'disciplina_hockey',
  'disciplina_padel',
  'disciplina_rugby',
  'disciplina_tenis',
  'federacion_hub',
  'polo_educativo'
)
AND capa IS NULL;
