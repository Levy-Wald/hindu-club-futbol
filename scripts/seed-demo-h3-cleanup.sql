-- =============================================================================
-- SPRINT H3 — Cleanup de datos demo sinteticos (PRE-FASE-C)
-- Ejecutar ANTES de cargar datos reales de Hindu
-- Orden: de mas dependiente a menos dependiente (FKs)
-- =============================================================================

BEGIN;

-- 1. Conciliacion bancaria (batch demo)
DELETE FROM conciliacion_movimientos_bancarios
WHERE import_batch_id = 'a0000000-0000-0000-0000-000000000001';

-- 2. Convenios de pago demo
DELETE FROM convenios_pago
WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  AND observaciones LIKE 'DEMO_%';

-- 3. Cotizaciones demo
DELETE FROM cotizaciones
WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  AND fuente = 'DEMO_seed';

-- 4. Movimientos de stock demo
DELETE FROM producto_movimientos_stock
WHERE notas = 'DEMO_movimiento';

-- 5. Stock por espacio demo
DELETE FROM producto_stock_espacio
WHERE notas LIKE 'DEMO_%';

-- 6. Precios demo
DELETE FROM producto_precios
WHERE notas = 'DEMO_precio';

-- 7. Variantes demo
DELETE FROM productos_variantes
WHERE nombre_variante LIKE 'DEMO_%';

-- 8. Listas de precios demo
DELETE FROM producto_listas_precios
WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  AND nombre LIKE 'DEMO Lista%';

-- 9. Depositos demo (espacios)
DELETE FROM espacios
WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  AND nombre LIKE 'DEMO %';

-- 10. Productos demo
DELETE FROM productos
WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  AND nombre LIKE 'DEMO_%';

-- 11. Re-activar padron "e" si necesario (opcional)
-- UPDATE padrones SET activo = true WHERE id = '3e272eff-744d-4292-b923-1f9b2946e75a';

COMMIT;

-- Verificacion post-cleanup
SELECT 'productos_variantes' as tabla, count(*) FROM productos_variantes WHERE nombre_variante LIKE 'DEMO_%'
UNION ALL SELECT 'producto_precios', count(*) FROM producto_precios WHERE notas = 'DEMO_precio'
UNION ALL SELECT 'cotizaciones', count(*) FROM cotizaciones WHERE fuente = 'DEMO_seed'
UNION ALL SELECT 'convenios_pago', count(*) FROM convenios_pago WHERE observaciones LIKE 'DEMO_%'
UNION ALL SELECT 'conciliacion_mb', count(*) FROM conciliacion_movimientos_bancarios WHERE import_batch_id = 'a0000000-0000-0000-0000-000000000001';
-- Todas deben dar 0
