-- B12.3 fix: Renombrar capas truncadas a nombres completos
-- Opus detecto que el INSERT original uso nombres truncados para las capas
-- de verticales nuevos. Este fix corrige a los nombres canonicos.
-- Aplicado originalmente via MCP Supabase el 2026-05-18

UPDATE catalogo_modulos SET capa = 'vertical_arquitectura' WHERE slug = 'vertical_arquitectura' AND capa != 'vertical_arquitectura';
UPDATE catalogo_modulos SET capa = 'vertical_abogacia' WHERE slug = 'vertical_abogacia' AND capa != 'vertical_abogacia';
UPDATE catalogo_modulos SET capa = 'vertical_publicidad' WHERE slug = 'vertical_publicidad' AND capa != 'vertical_publicidad';
