-- ============================================================================
-- F6.5 — BI Ejecutivo (Dashboard Director): registrar el módulo en el catálogo
-- ----------------------------------------------------------------------------
-- Página read-only /admin/direccion con KPIs del club sobre vistas analíticas
-- existentes. Sidebar data-driven (RFC-006): área finanzas → Dirección.
-- Gateado con finanzas.reportes (tenant.admin/admin_finanzas ya lo tienen).
-- ============================================================================

INSERT INTO catalogo_modulos (
  slug, nombre, nombre_display, descripcion, categoria, capa,
  ruta_bo, icono, area_sidebar_bo, sub_area_sidebar_bo, orden,
  capability_requerida, interfaz_primaria, activo_global, portable
)
VALUES (
  'bi_ejecutivo', 'BI ejecutivo', 'Dirección',
  'Dashboard director: KPIs del club (socios, cobranzas, ingresos, vencimientos)',
  'troncal', 'cross_vertical',
  '/admin/direccion', 'LayoutDashboard', 'finanzas', 'Dirección', 1,
  'finanzas.reportes', 'back_office', true, true
)
ON CONFLICT (slug) DO UPDATE SET
  ruta_bo = EXCLUDED.ruta_bo, icono = EXCLUDED.icono,
  area_sidebar_bo = EXCLUDED.area_sidebar_bo, sub_area_sidebar_bo = EXCLUDED.sub_area_sidebar_bo,
  capability_requerida = EXCLUDED.capability_requerida;

INSERT INTO tenant_modulos (tenant_id, modulo_slug, activo, fecha_activacion)
VALUES ('11111111-1111-1111-1111-111111111111', 'bi_ejecutivo', true, now())
ON CONFLICT (tenant_id, modulo_slug) DO UPDATE SET activo = true, fecha_desactivacion = NULL;

-- ============================================================================
-- ROLLBACK:
--   DELETE FROM tenant_modulos WHERE tenant_id='11111111-1111-1111-1111-111111111111' AND modulo_slug='bi_ejecutivo';
--   DELETE FROM catalogo_modulos WHERE slug='bi_ejecutivo';
-- ============================================================================
