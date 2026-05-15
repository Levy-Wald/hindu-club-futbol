-- =============================================================================
-- SPRINT H3 — Seed de datos demo sinteticos
-- Ejecutado: 2026-05-15 via MCP Supabase
-- Tenant: 11111111-1111-1111-1111-111111111111 (Hindu Club)
-- Convencion: todos los datos demo usan prefijo DEMO_ en nombres/notas
-- Cleanup: scripts/seed-demo-h3-cleanup.sql
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. LIMPIEZA PREVIA
-- ─────────────────────────────────────────────────────────────────────────────

-- Soft-delete padron "e" (test contaminado, 0 miembros)
UPDATE padrones SET activo = false
WHERE id = '3e272eff-744d-4292-b923-1f9b2946e75a'
  AND tenant_id = '11111111-1111-1111-1111-111111111111';

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PRODUCTOS DEMO (7 nuevos)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO productos (tenant_id, nombre, descripcion, tipo, tipo_uso, sku, moneda) VALUES
('11111111-1111-1111-1111-111111111111', 'DEMO_Remera Entrenamiento', 'Remera de entrenamiento deportiva', 'producto', 'reventa', 'DEMO-REM-ENT', 'ARS'),
('11111111-1111-1111-1111-111111111111', 'DEMO_Short Deportivo', 'Short deportivo oficial', 'producto', 'reventa', 'DEMO-SHO-DEP', 'ARS'),
('11111111-1111-1111-1111-111111111111', 'DEMO_Medias Oficial', 'Medias oficiales de competencia', 'producto', 'reventa', 'DEMO-MED-OFI', 'ARS'),
('11111111-1111-1111-1111-111111111111', 'DEMO_Campera Abrigo', 'Campera de abrigo con escudo', 'producto', 'reventa', 'DEMO-CAM-ABR', 'ARS'),
('11111111-1111-1111-1111-111111111111', 'DEMO_Pelota Entrenamiento', 'Pelota N5 para entrenamiento', 'producto', 'uso_interno_consumible', 'DEMO-PEL-ENT', 'ARS'),
('11111111-1111-1111-1111-111111111111', 'DEMO_Cuota Pileta', 'Servicio mensual de pileta', 'servicio', 'servicio', 'DEMO-CUO-PIL', 'ARS'),
('11111111-1111-1111-1111-111111111111', 'DEMO_Alquiler Quincho', 'Alquiler de quincho para eventos', 'servicio', 'servicio', 'DEMO-ALQ-QUI', 'ARS');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. DEPOSITOS DEMO (espacios tipo deposito)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO espacios (tenant_id, sede_id, nombre, tipo_slug, descripcion) VALUES
('11111111-1111-1111-1111-111111111111', '9fddd1e2-9ba1-42b4-9d85-c2d065226435', 'DEMO Deposito Principal', 'deposito', 'Deposito principal de mercaderia demo'),
('11111111-1111-1111-1111-111111111111', '64a9cfc2-ccc9-4925-a967-e9d8fd227c8f', 'DEMO Deposito Secundario', 'deposito', 'Deposito secundario demo en Country');

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. VARIANTES (20 filas: 5 productos x 4 talles)
-- ─────────────────────────────────────────────────────────────────────────────
-- Requiere IDs de productos existentes + DEMO. Se insertaron via MCP.
-- Productos usados: Camiseta Titular, Camiseta Suplente, DEMO_Remera, DEMO_Short, DEMO_Campera

-- (Las 20 filas fueron insertadas via MCP con nombre_variante DEMO_*)

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. LISTAS DE PRECIOS (2 listas DEMO)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO producto_listas_precios (tenant_id, slug, nombre, tipo, moneda, es_default, orden) VALUES
('11111111-1111-1111-1111-111111111111', 'demo-lista-ars-2026', 'DEMO Lista ARS 2026', 'venta', 'ARS', false, 10),
('11111111-1111-1111-1111-111111111111', 'demo-lista-usd-2026', 'DEMO Lista USD 2026', 'venta', 'USD', false, 11);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. PRECIOS (20 filas: 10 productos x 2 listas)
-- ─────────────────────────────────────────────────────────────────────────────
-- Insertados via MCP con notas = 'DEMO_precio'

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. STOCK POR ESPACIO (20 filas: 10 productos x 2 depositos)
-- ─────────────────────────────────────────────────────────────────────────────
-- Insertados via MCP con notas = 'DEMO_stock inicial'

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. MOVIMIENTOS DE STOCK (30 movimientos: 20 entradas + 10 salidas, 3 meses)
-- ─────────────────────────────────────────────────────────────────────────────
-- Insertados via MCP con notas = 'DEMO_movimiento'

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. COTIZACIONES USD/ARS (26 semanales, nov-2025 a may-2026)
-- ─────────────────────────────────────────────────────────────────────────────
-- Insertados via MCP con fuente = 'DEMO_seed'
-- Curva sintetica: 1045→1345 ARS/USD

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. CONVENIOS DE PAGO (5 convenios sinteticos)
-- ─────────────────────────────────────────────────────────────────────────────
-- Insertados via MCP con observaciones LIKE 'DEMO_%'

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. CONCILIACION BANCARIA (20 movimientos bancarios)
-- ─────────────────────────────────────────────────────────────────────────────
-- Insertados via MCP con descripcion LIKE 'DEMO_%'
-- 10 conciliado, 5 pendiente, 5 discrepancia
-- import_batch_id: a0000000-0000-0000-0000-000000000001
-- hash_dedup: demo_hash_001..020
