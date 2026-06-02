-- F1.8 (ADR-066): árbol de menú "por mundo-del-club".
-- Las siglas CRM/ERP/PIM/WMS no son labels de menú (viven en la columna capa).
--
-- 1) CHECK aditivo: agrega comercial / operaciones / comunicacion al set de
--    áreas válidas. Se mantienen marketing y recursos por compat (quedan vacías
--    tras la reasignación pero siguen siendo valores válidos).
-- 2) Reasignación de area_sidebar_bo según ADR-066 (sub_area no cambia).
--
-- Paridad verificada: recursos(10) = comercial(3) + operaciones(7);
-- marketing(4) -> comunicacion(4). 0 módulos huérfanos.

ALTER TABLE catalogo_modulos DROP CONSTRAINT IF EXISTS catalogo_modulos_area_sidebar_bo_check;

ALTER TABLE catalogo_modulos ADD CONSTRAINT catalogo_modulos_area_sidebar_bo_check
  CHECK (
    area_sidebar_bo IS NULL OR area_sidebar_bo = ANY (ARRAY[
      'inicio', 'personas', 'actividad',
      'comercial', 'operaciones', 'comunicacion',  -- F1.8 nuevas
      'marketing', 'recursos',                     -- legacy, vacías post-migración (compat)
      'finanzas', 'configuracion', 'admin_scl', 'no_aplica'
    ]::text[])
  );

-- COMERCIAL (venta) ← recursos
UPDATE catalogo_modulos SET area_sidebar_bo = 'comercial'
WHERE slug IN ('pim', 'proveedores', 'ecommerce_shop');

-- OPERACIONES (operativo) ← recursos
UPDATE catalogo_modulos SET area_sidebar_bo = 'operaciones'
WHERE slug IN ('reservas', 'espacios_fisicos', 'stock_movimientos', 'inventario_productos', 'utileria', 'diagramacion_club', 'proyectos');

-- COMUNICACION (rename de marketing)
UPDATE catalogo_modulos SET area_sidebar_bo = 'comunicacion'
WHERE slug IN ('comunicaciones_masivas', 'pre_inscripciones', 'comunicaciones_web', 'pre_inscripcion_landing');
