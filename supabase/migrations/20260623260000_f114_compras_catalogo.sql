-- ============================================================================
-- F1.14 — Compras: registrar el módulo en el catálogo + activarlo (tenant Hindu)
-- ----------------------------------------------------------------------------
-- A diferencia de proveedores (que ya estaba en catalogo_modulos), compras es un
-- módulo nuevo: se inserta su fila para que el sidebar data-driven (RFC-006) lo
-- renderice en área comercial → Compras, y se activa en tenant_modulos.
-- Gateado con finanzas.read (rol Compras/Tesorería/Admin; tenant.admin ya lo tiene).
-- ============================================================================

INSERT INTO catalogo_modulos (
  slug, nombre, nombre_display, descripcion, categoria, capa,
  ruta_bo, icono, area_sidebar_bo, sub_area_sidebar_bo, orden,
  capability_requerida, interfaz_primaria, activo_global, portable
)
VALUES (
  'compras', 'Compras', 'Compras',
  'Ciclo de compras: solicitud → orden de compra → recepción → factura',
  'operativo', 'cross_vertical',
  '/admin/compras', 'ShoppingCart', 'comercial', 'Compras', 1,
  'finanzas.read', 'back_office', true, true
)
ON CONFLICT (slug) DO UPDATE SET
  ruta_bo = EXCLUDED.ruta_bo,
  icono = EXCLUDED.icono,
  area_sidebar_bo = EXCLUDED.area_sidebar_bo,
  sub_area_sidebar_bo = EXCLUDED.sub_area_sidebar_bo,
  capability_requerida = EXCLUDED.capability_requerida;

INSERT INTO tenant_modulos (tenant_id, modulo_slug, activo, fecha_activacion)
VALUES ('11111111-1111-1111-1111-111111111111', 'compras', true, now())
ON CONFLICT (tenant_id, modulo_slug) DO UPDATE SET activo = true, fecha_desactivacion = NULL;

-- ============================================================================
-- ROLLBACK:
--   DELETE FROM tenant_modulos WHERE tenant_id='11111111-1111-1111-1111-111111111111' AND modulo_slug='compras';
--   DELETE FROM catalogo_modulos WHERE slug='compras';
-- ============================================================================
