-- F1.6 (RFC-006): sidebar data-driven desde catalogo_modulos
--
-- La agrupación (area_sidebar_bo / sub_area_sidebar_bo / nombre_display / orden)
-- ya estaba poblada. Faltan las columnas de presentación/ruteo para poder
-- renderizar el sidebar 100% desde la tabla:
--   - ruta_bo:              href del item en back office (NULL = sin página aún → no se renderiza)
--   - icono:               nombre del ícono lucide (string), resuelto en el cliente
--   - capability_requerida: capability que el rol necesita para ver el item (NULL = sin gate)
--   - sidebar_subitems:    sub-links opcionales dentro del módulo (jsonb array)
--
-- Aditivo y reversible. No toca datos existentes (todas las nuevas en NULL/[]).

ALTER TABLE catalogo_modulos
  ADD COLUMN IF NOT EXISTS ruta_bo text,
  ADD COLUMN IF NOT EXISTS icono text,
  ADD COLUMN IF NOT EXISTS capability_requerida text,
  ADD COLUMN IF NOT EXISTS sidebar_subitems jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN catalogo_modulos.ruta_bo IS 'F1.6: href del item en back office (sin segmento de tenant). NULL = módulo sin página → no se renderiza en el sidebar.';
COMMENT ON COLUMN catalogo_modulos.icono IS 'F1.6: nombre del ícono lucide-react para el sidebar.';
COMMENT ON COLUMN catalogo_modulos.capability_requerida IS 'F1.6: capability requerida para ver el item (admin la saltea). NULL = sin gate de capability.';
COMMENT ON COLUMN catalogo_modulos.sidebar_subitems IS 'F1.6: sub-links opcionales [{label, ruta_bo, capability_requerida, orden}].';
